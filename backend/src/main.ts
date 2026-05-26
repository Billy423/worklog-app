// App bootstrap. Builds the Nest app, wires global middleware/pipes/filters,
// applies the /api prefix, and starts the HTTP listener.

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import type { Env } from './config/env.schema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.use(helmet());

  const corsOrigin =
    config.get('NODE_ENV', { infer: true }) === 'production'
      ? config.get('CORS_ORIGIN', { infer: true })
      : 'http://localhost:5173';
  app.enableCors({ origin: corsOrigin ?? false, credentials: true });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: undefined });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  app.get(Logger).log(`WorkLog API listening on :${port} (env=${config.get('NODE_ENV', { infer: true })})`);
}

bootstrap();
