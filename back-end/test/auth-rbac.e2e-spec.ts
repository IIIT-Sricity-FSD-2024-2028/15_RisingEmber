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
      ['customer', 'aarav@gmail.com', '123456Ab@', 'user_2001'],
      ['provider', 'rohan@gmail.com', '123456Ab@', 'user_3001'],
      ['arbitrator', 'kabir@gmail.com', '123456Ab@', 'user_4001'],
      ['admin', 'admin@gmail.com', '123456Ab@', 'user_1001'],
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
      .send({ role: 'customer', email: 'aarav@gmail.com', password: 'wrong-password' })
      .expect(401);

    await request(app!.getHttpServer())
      .post('/api/v1/session/login')
      .send({ role: 'provider', email: 'aarav@gmail.com', password: '123456Ab@' })
      .expect(401);
  });

  it('rejects inactive accounts and malformed actor headers', async () => {
    const store = app!.get(StoreService);
    const provider = store.findUserById('user_3001');
    expect(provider).toBeDefined();
    provider!.isActive = false;

    await request(app!.getHttpServer())
      .post('/api/v1/session/login')
      .send({ role: 'provider', email: 'rohan@gmail.com', password: '123456Ab@' })
      .expect(403);

    provider!.isActive = true;

    await request(app!.getHttpServer()).get('/api/v1/users/me').expect(403);
    await request(app!.getHttpServer())
      .get('/api/v1/users/me')
      .set('x-role', 'provider')
      .set('x-actor-id', 'user_2001')
      .expect(403);
  });

  it('enforces each protected dashboard role boundary', async () => {
    const dashboardCases = [
      ['customer', 'user_2001', 'provider', 'user_3001'],
      ['provider', 'user_3001', 'customer', 'user_2001'],
      ['arbitrator', 'user_4001', 'customer', 'user_2001'],
      ['admin', 'user_1001', 'customer', 'user_2001'],
    ] as const;

    for (const [role, actorId, deniedRole, deniedActorId] of dashboardCases) {
      await request(app!.getHttpServer())
        .get(`/api/v1/dashboard/${role}`)
        .set('x-role', role)
        .set('x-actor-id', actorId)
        .expect(200);

      const denied = await request(app!.getHttpServer())
        .get(`/api/v1/dashboard/${role}`)
        .set('x-role', deniedRole)
        .set('x-actor-id', deniedActorId)
        .expect(403);

      expect(denied.body.message).toMatch(/permission/i);
    }
  });
});
