import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { IsArray, IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { ProfileWidgetsService } from './profile-widgets.service';

class AddWidgetDto {
  @IsString() @IsNotEmpty() widgetKey: string;
  @IsOptional() @IsObject() config?: Record<string, any>;
}

class UpdateWidgetDto {
  @IsOptional() @IsObject() config?: Record<string, any>;
  @IsOptional() @IsBoolean() isVisible?: boolean;
}

class ReorderDto {
  @IsArray() @IsString({ each: true }) order: string[];
}

@Controller('profile-widgets')
export class ProfileWidgetsController {
  constructor(private readonly widgets: ProfileWidgetsService) {}

  @Get('catalog')
  @Public()
  catalog() {
    return this.widgets.catalog();
  }

  @Get('me')
  mine(@CurrentUser() u: User) {
    return this.widgets.mine(u.id);
  }

  @Get('user/:userId')
  @Public()
  forUser(@Param('userId') userId: string) {
    return this.widgets.forUser(userId);
  }

  @Post()
  add(@CurrentUser() u: User, @Body() d: AddWidgetDto) {
    return this.widgets.add(u.id, d.widgetKey, d.config);
  }

  @Patch('reorder')
  reorder(@CurrentUser() u: User, @Body() d: ReorderDto) {
    return this.widgets.reorder(u.id, d.order);
  }

  @Patch(':id')
  update(@CurrentUser() u: User, @Param('id') id: string, @Body() d: UpdateWidgetDto) {
    return this.widgets.update(u.id, id, d);
  }

  @Delete(':id')
  async remove(@CurrentUser() u: User, @Param('id') id: string) {
    await this.widgets.remove(u.id, id);
    return { message: 'Widget removed' };
  }
}
