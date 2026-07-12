import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityModule } from '../community/community.module';
import { HomeLayout } from '../community/entities/community.entity';
import { SocialFollow, SocialPost } from '../social/social.entity';
import { HomeService } from './home.service';
import { HomeController } from './home.controller';

@Module({
  imports: [CommunityModule, TypeOrmModule.forFeature([HomeLayout, SocialPost, SocialFollow])],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
