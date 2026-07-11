export enum PlayStyle {
  SPEEDBALL = 'speedball',
  RECBALL = 'recball',
  SCENARIO = 'scenario',
  MAGFED = 'magfed',
  WOODSBALL = 'woodsball',
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  PRO = 'pro',
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  country?: string;
  stateProvince?: string;
  city?: string;
  playStyle?: PlayStyle[];
  skillLevel?: SkillLevel;
  homeField?: string;
  favoritePosition?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  listingsCount: number;
  eventsAttendedCount: number;
  sellerRating?: number;
  reviewCount: number;
}

export interface CreateUserDto {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  country?: string;
  stateProvince?: string;
  city?: string;
  playStyle?: PlayStyle[];
  skillLevel?: SkillLevel;
  homeField?: string;
  favoritePosition?: string;
}
