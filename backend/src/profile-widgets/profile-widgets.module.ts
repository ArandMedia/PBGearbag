import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileWidget } from './entities/profile-widget.entity';
import { ProfileWidgetsService } from './profile-widgets.service';
import { ProfileWidgetsController } from './profile-widgets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProfileWidget])],
  controllers: [ProfileWidgetsController],
  providers: [ProfileWidgetsService],
  exports: [ProfileWidgetsService],
})
export class ProfileWidgetsModule {}
