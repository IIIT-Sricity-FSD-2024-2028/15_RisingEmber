import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { closeTestApp, createTestApp } from './test-app';

describe('ServiceHub baseline request contract', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('keeps the public service catalogue reachable without actor headers', async () => {
    const response = await request(app!.getHttpServer()).get('/api/v1/services').expect(200);

    expect(response.body).toEqual(expect.objectContaining({ data: expect.any(Array) }));
  });

  it('rejects a protected request when actor headers are missing', async () => {
    const response = await request(app!.getHttpServer()).get('/api/v1/bookings').expect(403);

    expect(response.body.message).toMatch(/x-role/i);
  });

  it('rejects an actor whose role does not match the seeded account', async () => {
    const response = await request(app!.getHttpServer())
      .get('/api/v1/bookings')
      .set('x-role', 'provider')
      .set('x-actor-id', 'user_2001')
      .expect(403);

    expect(response.body.message).toMatch(/does not match/i);
  });

  it('rejects non-whitelisted service fields before the controller runs', async () => {
    const response = await request(app!.getHttpServer())
      .post('/api/v1/services')
      .set('x-role', 'provider')
      .set('x-actor-id', 'user_3001')
      .send({
        title: 'Baseline service',
        description: 'A valid baseline service description.',
        category: 'Maintenance',
        price: 100,
        durationMinutes: 60,
        location: 'Mumbai',
        unexpectedField: 'must be rejected',
      })
      .expect(400);

    expect(response.body.message).toEqual(expect.arrayContaining([
      expect.stringMatching(/unexpectedField/i),
    ]));
  });
});
