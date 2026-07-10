import { Injectable } from '@nestjs/common';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'moderate' | 'admin';
export type PermissionResource =
  | 'authentication' | 'users' | 'players' | 'teams' | 'fields' | 'marketplace' | 'businesses' | 'manufacturers'
  | 'events' | 'media' | 'learning' | 'messaging' | 'notifications' | 'reviews' | 'gearbag' | 'achievements'
  | 'badges' | 'analytics' | 'admin' | 'search';

export interface PermissionCheck {
  userId: string;
  roles: string[];
  resource: PermissionResource;
  action: PermissionAction;
  ownerId?: string;
}

@Injectable()
export class PermissionService {
  can(check: PermissionCheck): boolean {
    if (check.roles.includes('admin')) return true;
    if (check.ownerId && check.ownerId === check.userId && ['read', 'update', 'delete'].includes(check.action)) return true;
    return check.action === 'read';
  }
}
