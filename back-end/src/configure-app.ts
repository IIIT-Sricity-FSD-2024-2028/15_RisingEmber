import { INestApplication, ValidationPipe } from '@nestjs/common';

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
