import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { EventsModule } from './events/events.module';
import { SocialModule } from './social/social.module';
import { StreamingModule } from './streaming/streaming.module';
import { RankingsModule } from './rankings/rankings.module';
import { BrandsModule } from './brands/brands.module';
import { HealthModule } from './health/health.module';
import { dataSourceOptions } from './config/typeorm.config';
import { CommunityModule } from './community/community.module';
import { BillingModule } from './billing/billing.module';
import { ProfileWidgetsModule } from './profile-widgets/profile-widgets.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...dataSourceOptions,
        url: configService.getOrThrow<string>('DATABASE_URL'),
        ssl: configService.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        logging: configService.get('NODE_ENV') === 'development',
        migrations: [],
        retryAttempts: 1,
        retryDelay: 500,
        extra: { connectionTimeoutMillis: 5000 },
      }),
      inject: [ConfigService],
    }),

    // Common module
    CommonModule,

    // Feature modules
    AuthModule,
    UsersModule,
    TeamsModule,
    MarketplaceModule,
    EventsModule,
    SocialModule,
    StreamingModule,
    RankingsModule,
    BrandsModule,
    HealthModule,
    CommunityModule,
    BillingModule,
    ProfileWidgetsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
