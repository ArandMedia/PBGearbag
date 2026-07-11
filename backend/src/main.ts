import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import rateLimit from 'express-rate-limit';

export async function createApp() {
  // Body parsing is disabled here and configured manually below — the
  // Stripe webhook route needs the raw, unparsed request body to verify
  // its signature, so it can't go through Nest's default JSON parser.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const required=['DATABASE_URL','JWT_SECRET','REFRESH_TOKEN_SECRET'];for(const key of required){if(!configService.get(key))throw new Error(`Missing required environment variable: ${key}`)}
  app.set('trust proxy',1);

  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';

  // Body parsing — the Stripe webhook is registered first so it gets the
  // raw Buffer body Stripe's signature check requires; every other route
  // falls through to normal JSON/urlencoded parsing.
  app.use(
    `/${apiPrefix}/billing/webhook`,
    express.raw({ type: 'application/json' }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api/v1/auth',rateLimit({windowMs:15*60*1000,limit:Number(configService.get('AUTH_RATE_LIMIT_MAX')||40),standardHeaders:true,legacyHeaders:false}));
  app.use('/api/v1',rateLimit({windowMs:60*1000,limit:Number(configService.get('RATE_LIMIT_MAX')||180),standardHeaders:true,legacyHeaders:false}));

  app.use(new RequestIdMiddleware().use);
  app.useGlobalFilters(new ApiExceptionFilter());

  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Security
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.enableCors({
    origin: configService.get('FRONTEND_URL') || 'http://localhost:19006',
    credentials: true,
  });

  // Compression
  app.use(compression());

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Paintball Community API')
    .setDescription('API for the Paintball Community App')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('teams', 'Team management')
    .addTag('marketplace', 'Buy/Sell/Trade marketplace')
    .addTag('events', 'Event management')
    .addTag('social', 'Social features')
    .addTag('streaming', 'Live streaming')
    .addTag('rankings', 'Player and team rankings')
    .addTag('brands', 'Brand partnerships')
    .addTag('billing', 'Subscriptions and payments')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  return app;
}

if (require.main === module) {
  createApp().then(async app => {
    const port = process.env.PORT || 3000;
    await app.listen(port);
    new Logger('Bootstrap').log(`Server running on http://localhost:${port}`);
  }).catch((error: unknown) => {
    new Logger('Bootstrap').fatal('Application failed to start', error);
    process.exit(1);
  });
}
