import { Global, Module } from '@nestjs/common';
import { NotificationService } from './notifications/notification.service';
import { PermissionService } from './permissions/permission.service';
import { AuditLogService } from './audit/audit-log.service';
import { FeatureFlagService } from './feature-flags/feature-flag.service';
import { MediaService } from './media/media.service';
import { SearchService } from './search/search.service';

@Global()
@Module({
  providers: [NotificationService, PermissionService, AuditLogService, FeatureFlagService, MediaService, SearchService],
  exports: [NotificationService, PermissionService, AuditLogService, FeatureFlagService, MediaService, SearchService],
})
export class PlatformModule {}
