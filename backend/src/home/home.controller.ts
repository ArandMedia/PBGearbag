import { Body, Controller, Get, Put } from '@nestjs/common';
import { IsArray, IsBoolean, IsString } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { HomeService } from './home.service';

class LayoutBlockDto {
  @IsString() key: string;
  @IsBoolean() hidden: boolean;
}

class LayoutDto {
  @IsArray() blocks: LayoutBlockDto[];
}

@Controller('home')
export class HomeController {
  constructor(private readonly home: HomeService) {}

  @Get('feed')
  feed(@CurrentUser() u: User) {
    return this.home.getFeed(u.id);
  }

  @Get('layout')
  layout(@CurrentUser() u: User) {
    return this.home.getLayout(u.id);
  }

  @Put('layout')
  saveLayout(@CurrentUser() u: User, @Body() d: LayoutDto) {
    return this.home.saveLayout(u.id, d.blocks);
  }
}
