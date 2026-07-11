import { Module, Global } from '@nestjs/common';
import { UploadService } from './services/upload.service';

@Global()
@Module({
  providers: [UploadService],
  exports: [UploadService],
})
export class CommonModule {}
