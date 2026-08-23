import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { closeTestApp, createTestApp } from './test-app';
import { StoreService } from '../src/store/store.service';

describe('ServiceHub authentication and actor guard', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('authenticates each seeded role through the backend session endpoint', async () => {
    const credentials = [
      ['customer', 'aarav@servicehub.test', 'customer123', 'user_2001'],
      ['provider', 'rohan@servicehub.test', 'provider123', 'user_3001'],
      ['arbitrator', 'kabir@servicehub.test', 'arbitrator123', 'user_4001'],
      ['admin', 'admin@servicehub.test', 'admin123', 'user_1001'],
    ] as const;

    for (const [role, email, password, actorId] of credentials) {
      const response = await request(app!.getHttpServer())
        .post('/api/v1/session/login')
        .send({ role, email, password })
        .expect(201);

      expect(response.body.data).toEqual(expect.objectContaining({ actorId, role }));
      expect(response.body.data.profileSummary).toEqual(expect.objectContaining({ id: actorId, role }));
    }
  });

  it('rejects wrong passwords and role/email mismatches', async () => {
    await request(app!.getHttpServer())
      .post('/api/v1/session/login')
      .send({ role: 'customer', email: 'aarav@servicehub.test', password: 'wrong-password' })
      .expect(401);

    await request(app!.getHttpServer())
      .post('/api/v1/session/login')
      .send({ role: 'provider', email: 'aarav@servicehub.test', password: 'customer123' })
      .expect(401);
  });

  it('rejects inactive accounts and malformed actor headers', async () => {
    const store = app!.get(StoreService);
    const provider = store.findUserById('user_3001');
    expect(provider).toBeDefined();
    provider!.isActive = false;

    await request(app!.getHttpServer())
      .post('/api/v1/session/login')
      .send({ role: 'provider', email: 'rohan@servicehub.test', password: 'provider123' })
      .expect(403);

    provider!.isActive = true;

    await request(app!.getHttpServer()).get('/api/v1/users/me').expect(403);
    await request(app!.getHttpServer())
      .get('/api/v1/users/me')
      .set('x-role', 'provider')
      .set('x-actor-id', 'user_2001')
      .expect(403);
  });
});
