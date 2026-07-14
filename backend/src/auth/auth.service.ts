import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { IsNull, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Session } from './entities/session.entity';
import { AuthToken, AuthTokenType } from './entities/auth-token.entity';
import * as nodemailer from 'nodemailer';

export interface SessionContext { deviceName?: string; userAgent?: string; ipAddress?: string }
export interface AuthResponse { user: Partial<User>; accessToken: string; refreshToken: string; verificationToken?:string }
interface RefreshPayload { sub: string; sid: string; family: string; type: 'refresh'; exp: number }

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
    @InjectRepository(AuthToken) private readonly authTokens:Repository<AuthToken>,
  ) {}

  async register(dto: RegisterDto, context: SessionContext = {}): Promise<AuthResponse> {
    const existing = await this.usersService.findByEmailOrUsername(dto.email, dto.username);
    if (existing?.email === dto.email.toLowerCase()) throw new ConflictException('Email already exists');
    if (existing?.username === dto.username.toLowerCase()) throw new ConflictException('Username already exists');
    const normalizedEmail = dto.email.toLowerCase();
    const superAdminEmail = (this.configService.get('SUPER_ADMIN_EMAIL') || 'andrew@arandmedia.com').toLowerCase();
    const user = await this.usersService.create({ email:dto.email,username:dto.username,firstName:dto.firstName,lastName:dto.lastName,password:await bcrypt.hash(dto.password, 12),ageConfirmed:dto.ageConfirmed,termsAcceptedAt:new Date(),roles: normalizedEmail === superAdminEmail ? [UserRole.USER, UserRole.ADMIN] : [UserRole.USER] });
    const response=await this.startSession(user, context);const token=await this.issueToken(user,AuthTokenType.VERIFY,24*60);
    await this.deliverToken(user.email,token,AuthTokenType.VERIFY);
    if(this.configService.get('NODE_ENV')!=='production')response.verificationToken=token;
    return response;
  }

  async login(dto: LoginDto, context: SessionContext = {}): Promise<AuthResponse> {
    const user = await this.usersService.findByEmailOrUsername(dto.usernameOrEmail, dto.usernameOrEmail);
    if (!user || !user.isActive || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    await this.usersService.updateLastLogin(user.id);
    return this.startSession(user, context);
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    let payload: RefreshPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (payload.type !== 'refresh') throw new UnauthorizedException('Invalid refresh token');
    const session = await this.sessions.findOne({ where: { id: payload.sid }, relations: ['user'] });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.familyId !== payload.family) {
      throw new UnauthorizedException('Session expired or revoked');
    }
    if (!(await bcrypt.compare(refreshToken, session.tokenHash))) {
      await this.sessions.update({ familyId: session.familyId }, { revokedAt: new Date() });
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    const tokens = await this.generateTokens(session.user, session);
    session.tokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    session.lastUsedAt = new Date();
    session.expiresAt = this.tokenExpiry(tokens.refreshToken);
    await this.sessions.save(session);
    return { user: this.safeUser(session.user), ...tokens };
  }

  async logout(userId: string, sessionId: string): Promise<void> {
    await this.sessions.update({ id: sessionId, userId }, { revokedAt: new Date() });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessions.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  async listSessions(userId: string): Promise<Partial<Session>[]> {
    const sessions = await this.sessions.find({ where: { userId, revokedAt: IsNull() }, order: { createdAt: 'DESC' } });
    return sessions.map(({ tokenHash, user, ...safe }) => safe);
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await this.sessions.update({ id: sessionId, userId }, { revokedAt: new Date() });
  }

  async verifyEmail(token:string){const row=await this.consumeToken(token,AuthTokenType.VERIFY);await this.usersService.verifyEmail(row.userId);return{message:'Email verified'}}
  async resendVerification(email:string){const user=await this.usersService.findByEmail(email);if(user&&!user.isVerified){const token=await this.issueToken(user,AuthTokenType.VERIFY,24*60);await this.deliverToken(email,token,AuthTokenType.VERIFY);return this.configService.get('NODE_ENV')!=='production'?{message:'Verification sent',verificationToken:token}:{message:'Verification sent'}}return{message:'If the account exists, verification instructions were sent'}}
  async forgotPassword(email:string){const user=await this.usersService.findByEmail(email);if(user){const token=await this.issueToken(user,AuthTokenType.RESET,60);await this.deliverToken(email,token,AuthTokenType.RESET);if(this.configService.get('NODE_ENV')!=='production')return{message:'Reset instructions sent',resetToken:token}}return{message:'If the account exists, reset instructions were sent'}}
  async resetPassword(token:string,password:string){const row=await this.consumeToken(token,AuthTokenType.RESET);await this.usersService.updatePassword(row.userId,await bcrypt.hash(password,12));await this.logoutAll(row.userId);return{message:'Password reset successfully'}}

  async changePassword(userId:string,currentPassword:string,newPassword:string){
    const user=await this.usersService.findByIdWithPassword(userId);
    if(!user||!(await bcrypt.compare(currentPassword,user.password)))throw new UnauthorizedException('Current password is incorrect');
    await this.usersService.updatePassword(userId,await bcrypt.hash(newPassword,12));
    return{message:'Password changed successfully'};
  }
  async changeEmail(userId:string,password:string,newEmail:string){
    const user=await this.usersService.findByIdWithPassword(userId);
    if(!user||!(await bcrypt.compare(password,user.password)))throw new UnauthorizedException('Password is incorrect');
    const normalized=newEmail.toLowerCase();
    if(normalized===user.email)throw new ConflictException('That is already your email address');
    if(await this.usersService.findByEmail(normalized))throw new ConflictException('Email already in use');
    await this.usersService.setPendingEmail(userId,normalized);
    const token=await this.issueToken(user,AuthTokenType.EMAIL_CHANGE,60);
    await this.deliverToken(normalized,token,AuthTokenType.EMAIL_CHANGE);
    return{message:'Confirmation link sent to your new email address'};
  }
  async confirmEmailChange(token:string){
    const row=await this.consumeToken(token,AuthTokenType.EMAIL_CHANGE);
    const user=await this.usersService.findById(row.userId);
    if(!user?.pendingEmail)throw new UnauthorizedException('No pending email change found');
    await this.usersService.applyPendingEmailChange(row.userId,user.pendingEmail);
    return{message:'Email address updated'};
  }
  async changeUsername(userId:string,newUsername:string){
    const user=await this.usersService.findById(userId);
    if(!user)throw new UnauthorizedException('User not found');
    const normalized=newUsername.toLowerCase();
    if(normalized===user.username)throw new ConflictException('That is already your handle');
    if(user.usernameChangedAt){
      const daysSince=(Date.now()-new Date(user.usernameChangedAt).getTime())/86400000;
      if(daysSince<90){
        const daysLeft=Math.ceil(90-daysSince);
        throw new ConflictException(`You can change your handle again in ${daysLeft} day${daysLeft===1?'':'s'}`);
      }
    }
    if(await this.usersService.findByUsername(normalized))throw new ConflictException('That handle is already taken');
    await this.usersService.updateUsername(userId,normalized);
    return{message:'Handle updated'};
  }

  private async startSession(user: User, context: SessionContext): Promise<AuthResponse> {
    const session = await this.sessions.save(this.sessions.create({
      userId: user.id, tokenHash: 'pending', familyId: randomUUID(),
      deviceName: context.deviceName || 'Web browser', userAgent: context.userAgent,
      ipAddress: context.ipAddress, expiresAt: new Date(Date.now() + 30 * 86400000),
    }));
    const tokens = await this.generateTokens(user, session);
    session.tokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    session.expiresAt = this.tokenExpiry(tokens.refreshToken);
    await this.sessions.save(session);
    return { user: this.safeUser(user), ...tokens };
  }

  private async generateTokens(user: User, session: Session) {
    const base = { sub: user.id, sid: session.id, username: user.username, email: user.email, roles: user.roles };
    const accessToken = await this.jwtService.signAsync(base, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '15m',
    });
    const refreshToken = await this.jwtService.signAsync({ ...base, family: session.familyId, type: 'refresh' }, {
      secret: this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRATION') || '30d',
    });
    return { accessToken, refreshToken };
  }

  private tokenExpiry(token: string): Date {
    const decoded = this.jwtService.decode(token) as { exp: number };
    return new Date(decoded.exp * 1000);
  }

  private safeUser(user: User): Partial<User> {
    const { password, ...safe } = user;
    return safe;
  }
  private hashToken(token:string){return createHash('sha256').update(token).digest('hex')}
  private async issueToken(user:User,type:AuthTokenType,minutes:number){await this.authTokens.delete({userId:user.id,type,usedAt:IsNull()});const token=randomBytes(32).toString('hex');await this.authTokens.save({userId:user.id,type,tokenHash:this.hashToken(token),expiresAt:new Date(Date.now()+minutes*60000)});return token}
  private async consumeToken(token:string,type:AuthTokenType){const row=await this.authTokens.findOne({where:{tokenHash:this.hashToken(token),type,usedAt:IsNull()}});if(!row||row.expiresAt<=new Date())throw new UnauthorizedException('Token is invalid or expired');row.usedAt=new Date();return this.authTokens.save(row)}
  // Resend (HTTPS API, port 443) is preferred over raw SMTP: Render's free
  // tier blocks outbound SMTP ports at the network level, so nodemailer
  // just times out there regardless of how correct the credentials are.
  // SMTP stays as a fallback for hosts that don't block it.
  //
  // Every caller (register/forgotPassword/resendVerification/email-change)
  // needs to keep returning its normal, security-conscious response even
  // if the send itself fails — an email-provider outage or misconfig
  // (missing RESEND_API_KEY, SMTP blocked) shouldn't turn into a 500 that
  // leaks account existence or looks like a broken feature. The auth-token
  // row is already persisted by the time this runs, so a delivery failure
  // just means the user doesn't get the email — logged loudly here so a
  // real misconfiguration is visible in the server logs instead of silently
  // swallowed.
  private async deliverToken(email:string,token:string,type:AuthTokenType){
    try{
      const base=this.configService.get('FRONTEND_URL')||'http://localhost:8081';
      const path=type===AuthTokenType.VERIFY?'verify-email':type===AuthTokenType.EMAIL_CHANGE?'confirm-email-change':'reset-password';
      const subject=type===AuthTokenType.VERIFY?'Verify your PBGearbag account':type===AuthTokenType.EMAIL_CHANGE?'Confirm your new PBGearbag email':'Reset your PBGearbag password';
      const text=`Open ${base}/${path}?token=${token}`;
      const from=this.configService.get('EMAIL_FROM')||'PBGearbag <noreply@arandmedia.com>';

      const resendKey=this.configService.get<string>('RESEND_API_KEY');
      if(resendKey){
        const res=await fetch('https://api.resend.com/emails',{
          method:'POST',
          headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json'},
          body:JSON.stringify({from,to:email,subject,text}),
        });
        if(!res.ok){
          const body=await res.text().catch(()=>'');
          throw new Error(`Resend send failed: ${res.status} ${body}`);
        }
        return;
      }

      const host=this.configService.get<string>('SMTP_HOST');
      if(!host){
        this.logger.warn(`No email provider configured (RESEND_API_KEY/SMTP_HOST both unset) — ${type} email to ${email} was not sent`);
        return;
      }
      const transport=nodemailer.createTransport({host,port:Number(this.configService.get('SMTP_PORT')||587),secure:false,auth:{user:this.configService.get('SMTP_USER'),pass:this.configService.get('SMTP_PASSWORD')},connectionTimeout:8000,greetingTimeout:8000,socketTimeout:8000});
      await transport.sendMail({from,to:email,subject,text});
    }catch(error:any){
      this.logger.error(`Failed to deliver ${type} email to ${email}: ${error?.message||error}`);
    }
  }
}
