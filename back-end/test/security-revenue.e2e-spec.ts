import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { closeTestApp, createTestApp } from './test-app';
import { StoreService } from '../src/store/store.service';

const customerHeaders = {
  'x-role': 'customer',
  'x-actor-id': 'user_2001',
};

const providerHeaders = {
  'x-role': 'provider',
  'x-actor-id': 'user_3001',
};

const adminHeaders = {
  'x-role': 'admin',
  'x-actor-id': 'user_1001',
};

const currentCredentials = {
  role: 'customer',
  email: 'aarav@gmail.com',
  password: '123456Ab@',
};

function expectNoSecretFields(value: unknown) {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toMatch(/"password"\s*:/i);
  expect(serialized).not.toMatch(/"cardNumber"\s*:/i);
  expect(serialized).not.toMatch(/"cvv"\s*:/i);
}

describe('ServiceHub secure sessions and success-fee revenue', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(() => {
    app!.get(StoreService).setClockForTests(() => new Date('2026-09-01T09:00:00.000Z'));
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('issues an opaque session and never serializes credentials', async () => {
    const login = await request(app!.getHttpServer())
      .post('/api/v1/session/login')
      .send(currentCredentials)
      .expect(201);

    expect(login.body.data).toEqual(expect.objectContaining({
      actorId: 'user_2001',
      role: 'customer',
      sessionToken: expect.stringMatching(/^[A-Za-z0-9_-]{32,}$/),
      expiresAt: expect.any(String),
    }));
    expectNoSecretFields(login.body);

    const me = await request(app!.getHttpServer())
      .get('/api/v1/users/me')
      .set('authorization', `Bearer ${login.body.data.sessionToken}`)
      .expect(200);

    expect(me.body.data).toEqual(expect.objectContaining({ id: 'user_2001', role: 'customer' }));
    expectNoSecretFields(me.body);

    const publicServices = await request(app!.getHttpServer()).get('/api/v1/services').expect(200);
    expect(publicServices.body.data.length).toBeGreaterThan(0);
    for (const service of publicServices.body.data) {
      expect(service).not.toHaveProperty('providerEmail');
      expect(service).not.toHaveProperty('providerPhone');
    }
    expectNoSecretFields(publicServices.body);

    const publicReviews = await request(app!.getHttpServer()).get('/api/v1/reviews').expect(200);
    expectNoSecretFields(publicReviews.body);
  });

  it('does not let the public reset request replace a known account password', async () => {
    await request(app!.getHttpServer())
      .post('/api/v1/session/password-reset')
      .send({
        role: 'customer',
        identifier: currentCredentials.email,
        password: 'attacker-password',
      })
      .expect(202);

    await request(app!.getHttpServer())
      .post('/api/v1/session/login')
      .send({ ...currentCredentials, password: 'attacker-password' })
      .expect(401);

    await request(app!.getHttpServer())
      .post('/api/v1/session/login')
      .send(currentCredentials)
      .expect(201);
  });

  it('changes a password only with an authenticated session and the current password', async () => {
    const login = await request(app!.getHttpServer())
      .post('/api/v1/session/login')
      .send(currentCredentials)
      .expect(201);
    const authorization = `Bearer ${login.body.data.sessionToken}`;

    await request(app!.getHttpServer())
      .patch('/api/v1/session/password')
      .set('authorization', authorization)
      .send({ currentPassword: 'wrong-password', nextPassword: 'next-password-123' })
      .expect(401);

    await request(app!.getHttpServer())
      .patch('/api/v1/session/password')
      .set('authorization', authorization)
      .send({ currentPassword: currentCredentials.password, nextPassword: 'next-password-123' })
      .expect(200);

    await request(app!.getHttpServer())
      .post('/api/v1/session/login')
      .send(currentCredentials)
      .expect(401);

    const changedLogin = await request(app!.getHttpServer())
      .post('/api/v1/session/login')
      .send({ ...currentCredentials, password: 'next-password-123' })
      .expect(201);

    await request(app!.getHttpServer())
      .post('/api/v1/session/logout')
      .set('authorization', `Bearer ${changedLogin.body.data.sessionToken}`)
      .expect(200);

    await request(app!.getHttpServer())
      .get('/api/v1/users/me')
      .set('authorization', `Bearer ${changedLogin.body.data.sessionToken}`)
      .expect(403);
  });

  it('rejects password changes through the general profile endpoint', async () => {
    const login = await request(app!.getHttpServer())
      .post('/api/v1/session/login')
      .send(currentCredentials)
      .expect(201);

    await request(app!.getHttpServer())
      .patch('/api/v1/users/me')
      .set('authorization', `Bearer ${login.body.data.sessionToken}`)
      .send({ password: 'profile-bypass-password' })
      .expect(400);

    await request(app!.getHttpServer())
      .post('/api/v1/session/login')
      .send({ ...currentCredentials, password: 'profile-bypass-password' })
      .expect(401);
  });

  it('requires bearer sessions outside the explicit evaluation environment', async () => {
    const login = await request(app!.getHttpServer())
      .post('/api/v1/session/login')
      .send(currentCredentials)
      .expect(201);
    const previousNodeEnv = process.env.NODE_ENV;
    const previousEvaluationFlag = process.env.ALLOW_EVALUATION_ACTOR_HEADERS;

    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_EVALUATION_ACTOR_HEADERS;

    try {
      const rejected = await request(app!.getHttpServer())
        .get('/api/v1/users/me')
        .set(customerHeaders)
        .expect(403);
      expect(rejected.body.message).toMatch(/bearer session/i);

      await request(app!.getHttpServer())
        .get('/api/v1/users/me')
        .set('authorization', `Bearer ${login.body.data.sessionToken}`)
        .expect(200);
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNodeEnv;
      if (previousEvaluationFlag === undefined) delete process.env.ALLOW_EVALUATION_ACTOR_HEADERS;
      else process.env.ALLOW_EVALUATION_ACTOR_HEADERS = previousEvaluationFlag;
    }
  });

  it('creates one idempotent booking and earns a 5% provider success fee only on completion', async () => {
    const serviceResponse = await request(app!.getHttpServer())
      .post('/api/v1/services')
      .set(providerHeaders)
      .send({
        title: 'Revenue Demo Deep Clean',
        description: 'A deterministic service used to demonstrate the ServiceHub success fee.',
        category: 'Home Cleaning',
        price: 2000,
        durationMinutes: 120,
        location: 'Mumbai',
      })
      .expect(201);

    const adminBefore = await request(app!.getHttpServer())
      .get('/api/v1/dashboard/admin')
      .set(adminHeaders)
      .expect(200);
    const providerBefore = await request(app!.getHttpServer())
      .get('/api/v1/dashboard/provider')
      .set(providerHeaders)
      .expect(200);

    const payload = {
      serviceId: serviceResponse.body.data.id,
      scheduledAt: '2026-10-10T10:00:00.000Z',
      address: 'Powai, Mumbai, Building 7',
      idempotencyKey: 'revenue-demo-booking-1',
    };

    const created = await request(app!.getHttpServer())
      .post('/api/v1/bookings')
      .set(customerHeaders)
      .send(payload)
      .expect(201);

    expect(created.body.data).toEqual(expect.objectContaining({
      subtotalAmount: 2000,
      totalAmount: 2000,
      platformFeeRateBps: 500,
      platformFeeAmount: 100,
      providerPayoutAmount: 1900,
      platformFeeStatus: 'pending',
      escrowStatus: 'not_locked',
    }));

    const duplicate = await request(app!.getHttpServer())
      .post('/api/v1/bookings')
      .set(customerHeaders)
      .send(payload)
      .expect(201);
    expect(duplicate.body.data.id).toBe(created.body.data.id);

    await request(app!.getHttpServer())
      .post('/api/v1/bookings')
      .set(customerHeaders)
      .send({ ...payload, scheduledAt: '2026-10-11T10:00:00.000Z' })
      .expect(409);

    const matchingBookings = await request(app!.getHttpServer())
      .get(`/api/v1/bookings?serviceId=${encodeURIComponent(serviceResponse.body.data.id)}`)
      .set(customerHeaders)
      .expect(200);
    expect(matchingBookings.body.data).toHaveLength(1);

    await request(app!.getHttpServer())
      .patch(`/api/v1/bookings/${created.body.data.id}`)
      .set(providerHeaders)
      .send({ status: 'in_progress' })
      .expect(409);

    const confirmed = await request(app!.getHttpServer())
      .patch(`/api/v1/bookings/${created.body.data.id}`)
      .set(providerHeaders)
      .send({ status: 'confirmed' })
      .expect(200);
    expect(confirmed.body.data).toEqual(expect.objectContaining({
      escrowStatus: 'funds_locked',
      platformFeeStatus: 'pending',
    }));

    await request(app!.getHttpServer())
      .patch(`/api/v1/bookings/${created.body.data.id}`)
      .set(providerHeaders)
      .send({ status: 'in_progress' })
      .expect(200);

    const completed = await request(app!.getHttpServer())
      .patch(`/api/v1/bookings/${created.body.data.id}`)
      .set(providerHeaders)
      .send({ status: 'completed' })
      .expect(200);
    expect(completed.body.data).toEqual(expect.objectContaining({
      escrowStatus: 'released',
      platformFeeStatus: 'earned',
      platformFeeAmount: 100,
      providerPayoutAmount: 1900,
    }));

    const providerAfter = await request(app!.getHttpServer())
      .get('/api/v1/dashboard/provider')
      .set(providerHeaders)
      .expect(200);
    expect(providerAfter.body.data.metrics.grossEarnings).toBe(
      providerBefore.body.data.metrics.grossEarnings + 2000,
    );
    expect(providerAfter.body.data.metrics.platformFees).toBe(
      providerBefore.body.data.metrics.platformFees + 100,
    );
    expect(providerAfter.body.data.metrics.earnings).toBe(
      providerBefore.body.data.metrics.earnings + 1900,
    );

    const adminAfter = await request(app!.getHttpServer())
      .get('/api/v1/dashboard/admin')
      .set(adminHeaders)
      .expect(200);
    expect(adminAfter.body.data.metrics.platformRevenue).toBe(
      adminBefore.body.data.metrics.platformRevenue + 100,
    );

    await request(app!.getHttpServer())
      .post('/api/v1/reviews')
      .set(customerHeaders)
      .send({ bookingId: created.body.data.id, rating: 5, comment: 'Excellent service.' })
      .expect(201);

    const publicReviews = await request(app!.getHttpServer())
      .get(`/api/v1/reviews?serviceId=${encodeURIComponent(serviceResponse.body.data.id)}`)
      .expect(200);
    expect(publicReviews.body.data).toHaveLength(1);
    expect(publicReviews.body.data[0].customer).not.toHaveProperty('email');
    expect(publicReviews.body.data[0].customer).not.toHaveProperty('phone');
    expect(publicReviews.body.data[0].provider).not.toHaveProperty('email');
    expect(publicReviews.body.data[0].provider).not.toHaveProperty('phone');
    expectNoSecretFields(publicReviews.body);
  });

  it('voids an unearned success fee when a booking is cancelled', async () => {
    const services = await request(app!.getHttpServer()).get('/api/v1/services').expect(200);
    const serviceId = services.body.data[0].id as string;

    const created = await request(app!.getHttpServer())
      .post('/api/v1/bookings')
      .set(customerHeaders)
      .send({
        serviceId,
        scheduledAt: '2026-11-10T10:00:00.000Z',
        address: 'Powai, Mumbai, Building 7',
        idempotencyKey: 'revenue-demo-cancel-1',
      })
      .expect(201);

    const cancelled = await request(app!.getHttpServer())
      .patch(`/api/v1/bookings/${created.body.data.id}`)
      .set(customerHeaders)
      .send({ status: 'cancelled', cancellationReason: 'Plans changed.' })
      .expect(200);

    expect(cancelled.body.data).toEqual(expect.objectContaining({
      status: 'cancelled',
      escrowStatus: 'not_locked',
      platformFeeStatus: 'voided',
    }));
  });
});
