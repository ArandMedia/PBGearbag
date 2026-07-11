export enum Division {
  D1 = 'D1',
  D2 = 'D2',
  D3 = 'D3',
  D4 = 'D4',
  D5 = 'D5',
  OPEN = 'Open',
  AMATEUR = 'Amateur',
}

export enum TeamType {
  TOURNAMENT = 'tournament',
  RECREATIONAL = 'recreational',
  SCENARIO = 'scenario',
}

export enum TeamMemberRole {
  OWNER = 'owner',
  CAPTAIN = 'captain',
  CO_CAPTAIN = 'co-captain',
  MEMBER = 'member',
  SUBSTITUTE = 'substitute',
}

export enum Position {
  FRONT = 'front',
  MID = 'mid',
  BACK = 'back',
  SNAKE = 'snake',
  DORITO = 'dorito',
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  division?: Division;
  teamType: TeamType;
  region?: string;
  email?: string;
  websiteUrl?: string;
  socialLinks?: Record<string, string>;
  isRecruiting: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamMemberRole;
  position?: Position;
  jerseyNumber?: number;
  status: 'active' | 'inactive' | 'pending';
  joinedAt: Date;
  leftAt?: Date;
}

export interface CreateTeamDto {
  name: string;
  description?: string;
  division?: Division;
  teamType: TeamType;
  region?: string;
}

export interface UpdateTeamDto {
  name?: string;
  description?: string;
  division?: Division;
  region?: string;
  email?: string;
  websiteUrl?: string;
  isRecruiting?: boolean;
}
