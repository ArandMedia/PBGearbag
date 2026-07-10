import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { PlatformModule } from './platform/platform.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { EventsModule } from './events/events.module';
import { SocialModule } from './social/social.module';
import { StreamingModule } from './streaming/streaming.module';
import { RankingsModule } from './rankings/rankings.module';
import { BrandsModule } from './brands/brands.module';
import { SearchModule } from './domains/search/search.module';
import { AdminModule } from './domains/admin/admin.module';
import { AnalyticsModule } from './domains/analytics/analytics.module';
import { BadgesModule } from './domains/badges/badges.module';
import { AchievementsModule } from './domains/achievements/achievements.module';
import { GearbagModule } from './domains/gearbag/gearbag.module';
import { ReviewsModule } from './domains/reviews/reviews.module';
import { NotificationsModule } from './domains/notifications/notifications.module';
import { MessagingModule } from './domains/messaging/messaging.module';
import { LearningModule } from './domains/learning/learning.module';
import { MediaModule } from './domains/media/media.module';
import { ManufacturersModule } from './domains/manufacturers/manufacturers.module';
import { BusinessesModule } from './domains/businesses/businesses.module';
import { FieldsModule } from './domains/fields/fields.module';
import { PlayersModule } from './domains/players/players.module';

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
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        charset: 'utf8mb4',
        timezone: 'Z',
      }),
      inject: [ConfigService],
    }),

    // Platform foundation
    CommonModule,
    PlatformModule,

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
    PlayersModule,
    FieldsModule,
    BusinessesModule,
    ManufacturersModule,
    MediaModule,
    LearningModule,
    MessagingModule,
    NotificationsModule,
    ReviewsModule,
    GearbagModule,
    AchievementsModule,
    BadgesModule,
    AnalyticsModule,
    AdminModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
