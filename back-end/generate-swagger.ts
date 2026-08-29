import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './src/app.module';
import { enhanceSwaggerDocument } from './src/swagger-document';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
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
  const document = enhanceSwaggerDocument(SwaggerModule.createDocument(app, config));
  fs.mkdirSync('docs', { recursive: true });
  fs.writeFileSync('docs/swagger.json', JSON.stringify(document, null, 2));
  await app.close();
}
bootstrap();
