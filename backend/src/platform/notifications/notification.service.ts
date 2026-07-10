import { Injectable, Logger } from '@nestjs/common';

export type NotificationChannel = 'marketplace' | 'messages' | 'teams' | 'events' | 'reviews' | 'achievements' | 'admin';

export interface NotificationPayload {
  channel: NotificationChannel;
  recipientId: string;
  actorId?: string;
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async enqueue(payload: NotificationPayload): Promise<void> {
    this.logger.log(`Notification queued for ${payload.recipientId} on ${payload.channel}: ${payload.subject}`);
  }
}
