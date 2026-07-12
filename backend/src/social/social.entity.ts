import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "../users/entities/user.entity";

export enum PostType {
  CLIP = "clip",
  PHOTO = "photo",
  FIELD_REPORT = "field_report",
  GEAR_CHECK = "gear_check",
  EVENT_MOMENT = "event_moment",
  STORY = "story",
}
export enum ReactionType {
  HYPE = "hype",
  LOVE = "love",
  RESPECT = "respect",
  HELPFUL = "helpful",
}

@Entity("social_posts")
export class SocialPost {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Index() @Column({ name: "author_id" }) authorId: string;
  @ManyToOne(() => User) @JoinColumn({ name: "author_id" }) author: User;
  @Column({ type: "enum", enum: PostType, default: PostType.STORY })
  type: PostType;
  @Column({ type: "text" }) body: string;
  @Column({ name: "media_url", nullable: true }) mediaUrl?: string;
  @Column({ name: "thumbnail_url", nullable: true }) thumbnailUrl?: string;
  @Column({ name: "event_id", type: "uuid", nullable: true }) eventId?: string;
  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId?: string;
  @Column({ name: "location_label", nullable: true }) locationLabel?: string;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
}

@Entity("social_reactions")
@Index(["postId", "userId"], { unique: true })
export class SocialReaction {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Index() @Column({ name: "post_id" }) postId: string;
  @Index() @Column({ name: "user_id" }) userId: string;
  @Column({ type: "enum", enum: ReactionType }) type: ReactionType;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
}

@Entity("social_comments")
export class SocialComment {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Index() @Column({ name: "post_id" }) postId: string;
  @Index() @Column({ name: "author_id" }) authorId: string;
  @ManyToOne(() => User) @JoinColumn({ name: "author_id" }) author: User;
  @Column({ type: "text" }) body: string;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
}

@Entity("social_follows")
@Index(["followerId", "followingId"], { unique: true })
export class SocialFollow {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Index() @Column({ name: "follower_id", type: "uuid" }) followerId: string;
  @Index() @Column({ name: "following_id", type: "uuid" }) followingId: string;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
}

@Entity("user_blocks")
@Index(["blockerId", "blockedId"], { unique: true })
export class UserBlock {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Index() @Column({ name: "blocker_id", type: "uuid" }) blockerId: string;
  @Index() @Column({ name: "blocked_id", type: "uuid" }) blockedId: string;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
}
