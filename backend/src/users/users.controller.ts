import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  Post,
  UploadedFile,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeleteAccountDto, UpdateAccountSettingsDto } from './dto/account-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { Public } from '../auth/decorators/public.decorator';
import { UploadService } from '../common/services/upload.service';

// Fields safe to show on a public profile — notably excludes email, which
// has no reason to be visible to anyone but the account owner.
function toPublicProfile(user: User) {
  const {
    id, username, firstName, lastName, displayName, bio, avatarUrl,
    bannerUrl, country, stateProvince, city, playStyle, skillLevel,
    homeField, favoritePosition, isVerified, createdAt,
  } = user;
  return {
    id, username, firstName, lastName, displayName, bio, avatarUrl,
    bannerUrl, country, stateProvince, city, playStyle, skillLevel,
    homeField, favoritePosition, isVerified, createdAt,
  };
}

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly uploadService: UploadService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns all users' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const [users, total] = await this.usersService.findAll(page, limit);
    return {
      items: users.map(toPublicProfile),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search users' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns matching users' })
  async search(
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const [users, total] = await this.usersService.searchUsers(
      query,
      page,
      limit,
    );
    return {
      items: users.map(toPublicProfile),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Returns user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return user ? toPublicProfile(user) : user;
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(user.id, updateUserDto);
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update account settings (privacy, etc.)' })
  async updateSettings(
    @CurrentUser() user: User,
    @Body() dto: UpdateAccountSettingsDto,
  ) {
    await this.usersService.updateMessagePermission(user.id, dto.messagePermission);
    return { message: 'Settings updated' };
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  async deleteAccount(@CurrentUser() user: User, @Body() dto: DeleteAccountDto) {
    const withPassword = await this.usersService.findByIdWithPassword(user.id);
    if (!withPassword || !(await bcrypt.compare(dto.password, withPassword.password))) {
      throw new UnauthorizedException('Password is incorrect');
    }
    await this.usersService.remove(user.id);
    return { message: 'Account deleted successfully' };
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload avatar image' })
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully' })
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    // Delete old avatar if exists
    if (user.avatarUrl) {
      await this.uploadService.deleteFile(user.avatarUrl);
    }

    // Upload new avatar
    const avatarUrl = await this.uploadService.uploadFile(file, 'avatars');

    // Update user
    const updatedUser = await this.usersService.updateAvatar(user.id, avatarUrl);

    return {
      avatarUrl: updatedUser.avatarUrl,
      message: 'Avatar uploaded successfully',
    };
  }

  @Post('banner')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload banner image' })
  @ApiResponse({ status: 200, description: 'Banner uploaded successfully' })
  async uploadBanner(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Validate file size (10MB for banners)
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    // Delete old banner if exists
    if (user.bannerUrl) {
      await this.uploadService.deleteFile(user.bannerUrl);
    }

    // Upload new banner
    const bannerUrl = await this.uploadService.uploadFile(file, 'banners');

    // Update user
    const updatedUser = await this.usersService.updateBanner(user.id, bannerUrl);

    return {
      bannerUrl: updatedUser.bannerUrl,
      message: 'Banner uploaded successfully',
    };
  }
}
