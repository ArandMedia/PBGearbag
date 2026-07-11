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

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database (PostgreSQL / Neon)
    //
    // Prefers a single DATABASE_URL connection string (what Neon, Render,
    // Railway, and Fly.io all provide out of the box). Falls back to
    // discrete DB_* vars for local docker-compose development.
    //
    // synchronize is on by default because there are no migrations yet and
    // no production data exists. Once real user data exists, generate a
    // baseline migration (npm run migration:generate) and set DB_SYNC=false.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const nodeEnv = configService.get('NODE_ENV');
        const sslEnabled =
          configService.get('DB_SSL') === 'true' || nodeEnv === 'production';

        const common = {
          type: 'postgres' as const,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: configService.get('DB_SYNC') !== 'false',
          logging: nodeEnv === 'development',
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
        };

        if (databaseUrl) {
          return { ...common, url: databaseUrl };
        }

        return {
          ...common,
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT') || 5432,
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
        };
      },
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
