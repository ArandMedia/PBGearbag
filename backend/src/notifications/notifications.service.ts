import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../community/entities/community.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private notifications: Repository<Notification>,
  ) {}

  async create(
    userId: string,
    type: string,
    title: string,
    body: string,
    actionUrl?: string,
    data: Record<string, unknown> = {},
  ) {
    return this.notifications.save(
      this.notifications.create({ userId, type, title, body, actionUrl, data }),
    );
  }

  async notifyMany(
    userIds: string[],
    type: string,
    title: string,
    body: string,
    actionUrl?: string,
    data: Record<string, unknown> = {},
  ) {
    if (!userIds.length) return;
    await this.notifications.save(
      userIds.map((userId) =>
        this.notifications.create({ userId, type, title, body, actionUrl, data }),
      ),
    );
  }
}
