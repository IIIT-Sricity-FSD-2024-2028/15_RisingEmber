import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';

export async function createTestApp(): Promise<INestApplication> {
  const testingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = testingModule.createNestApplication({ logger: false, bodyParser: false });

  configureApp(app, { enableCors: true });

  await app.listen(0, '127.0.0.1');
  return app;
}

export async function closeTestApp(app?: INestApplication): Promise<void> {
  if (!app) return;
  await app.close();
}
