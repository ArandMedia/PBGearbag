import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Delete,
  Param,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { Request } from 'express';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangeEmailDto, ChangePasswordDto, ChangeUsernameDto, EmailDto, ResetPasswordDto, TokenDto } from './dto/account-lifecycle.dto';

type AuthenticatedUser = User & { sessionId: string };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  async register(@Body() registerDto: RegisterDto, @Req() request: Request) {
    return this.authService.register(registerDto, this.sessionContext(request));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Req() request: Request) {
    return this.authService.login(loginDto, this.sessionContext(request));
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.logout(user.id, user.sessionId);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Returns current user' })
  async getCurrentUser(@CurrentUser() user: User) {
    const { password, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  async refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('verify-email') @Public() async verifyEmail(@Body()dto:TokenDto){return this.authService.verifyEmail(dto.token)}
  @Post('resend-verification') @Public() async resendVerification(@Body()dto:EmailDto){return this.authService.resendVerification(dto.email)}
  @Post('forgot-password') @Public() async forgotPassword(@Body()dto:EmailDto){return this.authService.forgotPassword(dto.email)}
  @Post('reset-password') @Public() async resetPassword(@Body()dto:ResetPasswordDto){return this.authService.resetPassword(dto.token,dto.password)}

  @Post('change-password') @ApiBearerAuth() async changePassword(@CurrentUser()user:User,@Body()dto:ChangePasswordDto){return this.authService.changePassword(user.id,dto.currentPassword,dto.newPassword)}
  @Post('change-email') @ApiBearerAuth() async changeEmail(@CurrentUser()user:User,@Body()dto:ChangeEmailDto){return this.authService.changeEmail(user.id,dto.password,dto.newEmail)}
  @Post('confirm-email-change') @Public() async confirmEmailChange(@Body()dto:TokenDto){return this.authService.confirmEmailChange(dto.token)}
  @Post('change-username') @ApiBearerAuth() async changeUsername(@CurrentUser()user:User,@Body()dto:ChangeUsernameDto){return this.authService.changeUsername(user.id,dto.username)}

  @Get('sessions')
  @ApiBearerAuth()
  async sessions(@CurrentUser() user: User) {
    return this.authService.listSessions(user.id);
  }

  @Delete('sessions/:id')
  @ApiBearerAuth()
  async revokeSession(@CurrentUser() user: User, @Param('id') id: string) {
    await this.authService.revokeSession(user.id, id);
    return { message: 'Session revoked' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  async logoutAll(@CurrentUser() user: User) {
    await this.authService.logoutAll(user.id);
    return { message: 'All sessions revoked' };
  }

  private sessionContext(request: Request) {
    return {
      deviceName: request.header('x-device-name') || 'Web browser',
      userAgent: request.header('user-agent'),
      ipAddress: request.ip,
    };
  }
}
