import { INestApplication, ValidationPipe } from '@nestjs/common';

const express = require('express') as {
  json: (options: { limit: string }) => any;
};

export interface ConfigureAppOptions {
  enableCors?: boolean;
}

export function configureApp(
  app: INestApplication,
  options: ConfigureAppOptions = {},
): INestApplication {
  if (options.enableCors) {
    app.enableCors({
      origin: true,
      credentials: false,
    });
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

  return app;
}
