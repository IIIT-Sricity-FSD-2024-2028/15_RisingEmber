import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { enhanceSwaggerDocument } from './swagger-document';
import { appLogger } from './common/logger/winston-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  configureApp(app, { enableCors: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ServiceHub API')
    .setDescription(
      'ServiceHub evaluation API. Use x-role and x-actor-id as evaluation-only identity context headers; '
      + 'they are not production authentication. Errors return statusCode, code, message, timestamp, path, and requestId.',
    )
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-role',
        in: 'header',
        description: 'Role used for RBAC: customer, provider, admin, or arbitrator.',
      },
      'RoleHeader',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-actor-id',
        in: 'header',
        description: 'In-memory actor id matching the selected x-role.',
      },
      'ActorHeader',
    )
    .build();
  const swaggerDocument = enhanceSwaggerDocument(SwaggerModule.createDocument(app, swaggerConfig));
  SwaggerModule.setup('api-docs', app, swaggerDocument as any);

  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  await app.listen(port, host);

  const backendUrl = `http://${host}:${port}/api/v1`;
  const swaggerUrl = `http://${host}:${port}/api-docs`;

  // eslint-disable-next-line no-console
  console.log(`ServiceHub backend running on ${backendUrl}`);
  // eslint-disable-next-line no-console
  console.log(`Swagger docs available at ${swaggerUrl}`);

  // Log server startup to Winston application log file
  appLogger.info('ServiceHub backend started', {
    event: 'SERVER_START',
    url: backendUrl,
    swaggerUrl,
    port,
    host,
    nodeEnv: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
}

bootstrap();

