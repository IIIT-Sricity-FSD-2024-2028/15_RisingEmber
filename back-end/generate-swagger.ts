import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './src/app.module';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('ServiceHub API')
    .setDescription('ServiceHub unified API documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  fs.writeFileSync('swagger.json', JSON.stringify(document, null, 2));
  await app.close();
}
bootstrap();
