import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { enhanceSwaggerDocument } from './swagger-document';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  configureApp(app, { enableCors: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ServiceHub API')
    .setDescription('Review-4 REST API documentation for ServiceHub.')
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
  // eslint-disable-next-line no-console
  console.log(`ServiceHub backend running on http://${host}:${port}/api/v1`);
  // eslint-disable-next-line no-console
  console.log(`Swagger docs available at http://${host}:${port}/api-docs`);
}

bootstrap();
