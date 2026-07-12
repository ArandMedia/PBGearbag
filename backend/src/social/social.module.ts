import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
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
  ],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
