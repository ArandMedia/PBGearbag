import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import { Exclude } from "class-transformer";

export enum PlayStyle {
  SPEEDBALL = "speedball",
  TOURNAMENT = "tournament",
  MECHANICAL = "mechanical",
  PUMP = "pump",
  RECBALL = "recball",
  SCENARIO = "scenario",
  BIG_GAME = "big_game",
  MAGFED = "magfed",
  WOODSBALL = "woodsball",
}

export enum SkillLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
  PRO = "pro",
}

export enum UserRole {
  USER = "user",
  MODERATOR = "moderator",
  ADMIN = "admin",
}

export enum MessagePermission {
  EVERYONE = "everyone",
  FOLLOWING = "following",
  NOBODY = "nobody",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: "pending_email", nullable: true })
  pendingEmail?: string;

  @Column({ unique: true })
  username: string;

  @Column({ select: false })
  @Exclude()
  password: string;

  @Column({ name: "first_name", nullable: true })
  firstName?: string;

  @Column({ name: "last_name", nullable: true })
  lastName?: string;

  @Column({ name: "display_name", nullable: true })
  displayName?: string;

  @Column({ type: "text", nullable: true })
  bio?: string;

  @Column({ name: "avatar_url", nullable: true })
  avatarUrl?: string;

  @Column({ name: "banner_url", nullable: true })
  bannerUrl?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ name: "state_province", nullable: true })
  stateProvince?: string;

  @Column({ nullable: true })
  city?: string;

  @Column("simple-array", { name: "play_style", nullable: true })
  playStyle?: PlayStyle[];

  @Column({
    type: "enum",
    enum: SkillLevel,
    name: "skill_level",
    nullable: true,
  })
  skillLevel?: SkillLevel;

  @Column({ name: "home_field", nullable: true })
  homeField?: string;

  @Column({ name: "favorite_position", nullable: true })
  favoritePosition?: string;

  @Column({ name: "is_verified", default: false })
  isVerified: boolean;

  @Column({ name: "email_verified_at", type: "timestamptz", nullable: true })
  emailVerifiedAt?: Date;

  @Column({ name: "terms_accepted_at", type: "timestamptz", nullable: true })
  termsAcceptedAt?: Date;

  @Column({ name: "age_confirmed", default: false })
  ageConfirmed: boolean;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @Column("simple-array", { default: UserRole.USER })
  roles: UserRole[];

  @Column({
    name: "message_permission",
    default: MessagePermission.EVERYONE,
  })
  messagePermission: MessagePermission;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "last_login_at", nullable: true })
  lastLoginAt?: Date;

  @Column({ name: "stripe_customer_id", nullable: true })
  @Exclude()
  stripeCustomerId?: string;

  @Column({ name: "theme_color", nullable: true })
  themeColor?: string;

  @Column({ name: "username_changed_at", type: "timestamptz", nullable: true })
  usernameChangedAt?: Date;

  @BeforeInsert()
  @BeforeUpdate()
  emailToLowerCase() {
    this.email = this.email.toLowerCase();
  }

  @BeforeInsert()
  @BeforeUpdate()
  usernameToLowerCase() {
    this.username = this.username.toLowerCase();
  }
}
