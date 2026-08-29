import { ForbiddenException, INestApplication, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

const express = require('express') as {
  json: (options: { limit: string }) => any;
};
const helmet = require('helmet') as (options?: Record<string, unknown>) => any;

export interface ConfigureAppOptions {
  enableCors?: boolean;
  frontendOrigins?: string[];
}

function resolveFrontendOrigins(options: ConfigureAppOptions) {
  const configured = options.frontendOrigins
    || String(process.env.FRONTEND_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean);
  return configured.length > 0 ? configured : ['http://127.0.0.1:8080', 'http://localhost:8080'];
}

export function configureApp(
  app: INestApplication,
  options: ConfigureAppOptions = {},
): INestApplication {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: false,
  }));

  if (options.enableCors) {
    app.enableCors({
      origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
        if (!origin || resolveFrontendOrigins(options).includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new ForbiddenException('Origin is not allowed by the ServiceHub CORS policy.'));
      },
      credentials: false,
    } as any);
  }

  app.setGlobalPrefix('api/v1');
  app.use('/api/v1/documents', express.json({ limit: '35mb' }));
  app.use(express.json({ limit: '1mb' }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  return app;
}
