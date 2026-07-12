import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { NotificationsModule } from "../notifications/notifications.module";
import {
  SocialComment,
  SocialFollow,
  SocialPost,
  SocialReaction,
  UserBlock,
} from "./social.entity";
import { SocialService } from "./social.service";
import { SocialController } from "./social.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SocialPost,
      SocialReaction,
      SocialComment,
      SocialFollow,
      UserBlock,
      User,
    ]),
    NotificationsModule,
  ],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
