import { Injectable, Logger } from '@nestjs/common';

export interface AuditLogEntry {
  actorId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  record(entry: AuditLogEntry): void {
    this.logger.log(`AUDIT ${entry.action} ${entry.resource}${entry.resourceId ? `:${entry.resourceId}` : ''} actor=${entry.actorId ?? 'system'}`);
  }
}
