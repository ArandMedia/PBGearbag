import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

// bcrypt cost is deliberately low here for test speed — bcrypt.compare
// works against a hash regardless of the cost it was created with, so this
// doesn't weaken what's actually being verified (AuthService itself always
// hashes real user passwords at cost 12).
const PASSWORD = 'CorrectHorseBattery1';
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 4);

function makeUser(overrides: Partial<any> = {}) {
  return {
    id: 'user-1',
    email: 'player@example.com',
    username: 'player1',
    password: PASSWORD_HASH,
    isActive: true,
    roles: ['user'],
    usernameChangedAt: null,
    ...overrides,
  };
}

function makeService(overrides: Partial<any> = {}) {
  const usersService = {
    findByEmailOrUsername: jest.fn().mockResolvedValue(null),
    findByEmail: jest.fn().mockResolvedValue(null),
    findByUsername: jest.fn().mockResolvedValue(null),
    findById: jest.fn(),
    findByIdWithPassword: jest.fn(),
    create: jest.fn(),
    updateLastLogin: jest.fn().mockResolvedValue(undefined),
    updatePassword: jest.fn().mockResolvedValue(undefined),
    updateUsername: jest.fn().mockResolvedValue(undefined),
    verifyEmail: jest.fn().mockResolvedValue(undefined),
    setPendingEmail: jest.fn().mockResolvedValue(undefined),
    applyPendingEmailChange: jest.fn().mockResolvedValue(undefined),
    ...overrides.usersService,
  };
  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
    verifyAsync: jest.fn(),
    decode: jest.fn().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 900 }),
    ...overrides.jwtService,
  };
  const configValues: Record<string, string> = { NODE_ENV: 'test', JWT_SECRET: 'test-secret', REFRESH_TOKEN_SECRET: 'test-refresh-secret', ...overrides.config };
  const configService = {
    get: jest.fn((key: string) => configValues[key]),
    getOrThrow: jest.fn((key: string) => {
      if (!(key in configValues)) throw new Error(`Missing config: ${key}`);
      return configValues[key];
    }),
  };
  const sessions = {
    create: jest.fn((x: any) => x),
    save: jest.fn((x: any) => Promise.resolve({ id: 'session-1', ...x })),
    findOne: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    find: jest.fn().mockResolvedValue([]),
    ...overrides.sessions,
  };
  const authTokens = {
    delete: jest.fn().mockResolvedValue(undefined),
    save: jest.fn((x: any) => Promise.resolve({ id: 'token-1', ...x })),
    findOne: jest.fn(),
    ...overrides.authTokens,
  };
  const service = new AuthService(usersService as any, jwtService as any, configService as any, sessions as any, authTokens as any);
  return { service, usersService, jwtService, configService, sessions, authTokens };
}

describe('AuthService', () => {
  describe('register', () => {
    it('rejects a duplicate email', async () => {
      const { service, usersService } = makeService();
      usersService.findByEmailOrUsername.mockResolvedValue({ email: 'taken@example.com', username: 'someoneelse' });
      await expect(
        service.register({ email: 'taken@example.com', username: 'newname', password: PASSWORD, ageConfirmed: true } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a duplicate username', async () => {
      const { service, usersService } = makeService();
      usersService.findByEmailOrUsername.mockResolvedValue({ email: 'other@example.com', username: 'taken' });
      await expect(
        service.register({ email: 'new@example.com', username: 'taken', password: PASSWORD, ageConfirmed: true } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates the account and returns a dev-mode verification token', async () => {
      const { service, usersService } = makeService();
      usersService.create.mockResolvedValue(makeUser());
      const result = await service.register({ email: 'player@example.com', username: 'player1', password: PASSWORD, ageConfirmed: true } as any);
      expect(usersService.create).toHaveBeenCalled();
      expect(result.accessToken).toBeDefined();
      expect(result.verificationToken).toBeDefined();
    });
  });

  describe('login', () => {
    it('rejects an unknown user', async () => {
      const { service } = makeService();
      await expect(service.login({ usernameOrEmail: 'nobody', password: 'x' } as any)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects the wrong password', async () => {
      const { service, usersService } = makeService();
      usersService.findByEmailOrUsername.mockResolvedValue(makeUser());
      await expect(service.login({ usernameOrEmail: 'player1', password: 'wrong-password' } as any)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a deactivated account even with the right password', async () => {
      const { service, usersService } = makeService();
      usersService.findByEmailOrUsername.mockResolvedValue(makeUser({ isActive: false }));
      await expect(service.login({ usernameOrEmail: 'player1', password: PASSWORD } as any)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('succeeds with correct credentials and issues tokens', async () => {
      const { service, usersService } = makeService();
      usersService.findByEmailOrUsername.mockResolvedValue(makeUser());
      const result = await service.login({ usernameOrEmail: 'player1', password: PASSWORD } as any);
      expect(usersService.updateLastLogin).toHaveBeenCalledWith('user-1');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect((result.user as any).password).toBeUndefined();
    });
  });

  describe('resetPassword', () => {
    it('rejects an expired or already-used token', async () => {
      const { service, authTokens } = makeService();
      authTokens.findOne.mockResolvedValue({ userId: 'user-1', expiresAt: new Date(Date.now() - 1000), usedAt: null });
      await expect(service.resetPassword('bad-token', 'NewPassword1')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a token that does not exist', async () => {
      const { service, authTokens } = makeService();
      authTokens.findOne.mockResolvedValue(null);
      await expect(service.resetPassword('nonexistent', 'NewPassword1')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('updates the password and logs out every session on a valid token', async () => {
      const { service, authTokens, usersService, sessions } = makeService();
      authTokens.findOne.mockResolvedValue({ userId: 'user-1', expiresAt: new Date(Date.now() + 60000), usedAt: null });
      await service.resetPassword('good-token', 'NewPassword1');
      expect(usersService.updatePassword).toHaveBeenCalledWith('user-1', expect.any(String));
      expect(sessions.update).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' }),
        expect.objectContaining({ revokedAt: expect.any(Date) }),
      );
    });
  });

  describe('forgotPassword — email delivery failures never surface to the caller', () => {
    it('still returns the generic response when the email provider throws', async () => {
      const { service, usersService, configService } = makeService({ config: { RESEND_API_KEY: 'fake-key' } });
      usersService.findByEmail.mockResolvedValue(makeUser());
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as any;
      try {
        const result = await service.forgotPassword('player@example.com');
        expect(result.message).toBeDefined();
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('changeUsername', () => {
    it('blocks a second change inside the 90-day cooldown', async () => {
      const { service, usersService } = makeService();
      usersService.findById.mockResolvedValue(makeUser({ usernameChangedAt: new Date(Date.now() - 10 * 86400000) }));
      await expect(service.changeUsername('user-1', 'newhandle')).rejects.toBeInstanceOf(ConflictException);
    });

    it('allows a change once 90 days have passed', async () => {
      const { service, usersService } = makeService();
      usersService.findById.mockResolvedValue(makeUser({ usernameChangedAt: new Date(Date.now() - 91 * 86400000) }));
      usersService.findByUsername.mockResolvedValue(null);
      const result = await service.changeUsername('user-1', 'newhandle');
      expect(usersService.updateUsername).toHaveBeenCalledWith('user-1', 'newhandle');
      expect(result.message).toBeDefined();
    });

    it('rejects a handle that is already taken', async () => {
      const { service, usersService } = makeService();
      usersService.findById.mockResolvedValue(makeUser());
      usersService.findByUsername.mockResolvedValue({ id: 'someone-else' });
      await expect(service.changeUsername('user-1', 'takenhandle')).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
