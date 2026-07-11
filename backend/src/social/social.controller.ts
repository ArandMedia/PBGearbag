import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UploadService } from "../common/services/upload.service";
import { User } from "../users/entities/user.entity";
import { PostType, ReactionType } from "./social.entity";
import { SocialService } from "./social.service";
class PostDto {
  @IsEnum(PostType) type: PostType;
  @IsString() @IsNotEmpty() @MaxLength(3000) body: string;
  @IsOptional() @IsString() mediaUrl?: string;
  @IsOptional() @IsString() thumbnailUrl?: string;
  @IsOptional() @IsString() eventId?: string;
  @IsOptional() @IsString() organizationId?: string;
  @IsOptional() @IsString() locationLabel?: string;
}
class ReactionDto {
  @IsEnum(ReactionType) type: ReactionType;
}
class CommentDto {
  @IsString() @IsNotEmpty() @MaxLength(1000) body: string;
}
@Controller("feed")
export class SocialController {
  constructor(
    private social: SocialService,
    private uploads: UploadService,
  ) {}
  @Get() feed(
    @CurrentUser() u: User,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("following") following?: string,
  ) {
    return this.social.feed(u.id, page, 20, following === "true");
  }
  @Post() create(@CurrentUser() u: User, @Body() d: PostDto) {
    return this.social.create(u.id, d);
  }
  @Post("upload") @UseInterceptors(FileInterceptor("file")) async upload(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("No media selected");
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/quicktime",
      "video/webm",
    ];
    if (!allowed.includes(file.mimetype))
      throw new BadRequestException(
        "Use a JPG, PNG, WebP, MP4, MOV, or WebM file",
      );
    if (file.size > 100 * 1024 * 1024)
      throw new BadRequestException("Media must be under 100MB");
    return { mediaUrl: await this.uploads.uploadFile(file, "feed") };
  }
  @Post(":id/reactions") react(
    @CurrentUser() u: User,
    @Param("id") id: string,
    @Body() d: ReactionDto,
  ) {
    return this.social.react(u.id, id, d.type);
  }
  @Get(":id/comments") comments(@Param("id") id: string) {
    return this.social.commentsFor(id);
  }
  @Post(":id/comments") comment(
    @CurrentUser() u: User,
    @Param("id") id: string,
    @Body() d: CommentDto,
  ) {
    return this.social.comment(u.id, id, d.body);
  }
  @Post("users/:id/follow") follow(
    @CurrentUser() u: User,
    @Param("id") id: string,
  ) {
    return this.social.follow(u.id, id);
  }
  @Get("following") following(@CurrentUser() u: User) {
    return this.social.following(u.id);
  }
}
