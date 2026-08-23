import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { closeTestApp, createTestApp } from './test-app';
import { DEMO_SEED_NOW } from '../src/store/demo-seed';
import { StoreService } from '../src/store/store.service';

const adminHeaders = {
  'x-role': 'admin',
  'x-actor-id': 'user_1001',
};

describe('ServiceHub evaluation seed', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('keeps the seeded marketplace and dispute scenario ahead of the demo clock', async () => {
    const [bookings, cases, hearings, awards, users] = await Promise.all([
      request(app!.getHttpServer()).get('/api/v1/bookings').set(adminHeaders).expect(200),
      request(app!.getHttpServer()).get('/api/v1/cases').set(adminHeaders).expect(200),
      request(app!.getHttpServer()).get('/api/v1/hearings').set(adminHeaders).expect(200),
      request(app!.getHttpServer()).get('/api/v1/awards').set(adminHeaders).expect(200),
      request(app!.getHttpServer()).get('/api/v1/users').set(adminHeaders).expect(200),
    ]);

    expect(users.body.data).toHaveLength(7);
    expect(users.body.data.map((entry: { id: string }) => entry.id)).toEqual(expect.arrayContaining([
      'user_1001',
      'user_2001',
      'user_2002',
      'user_3001',
      'user_3002',
      'user_4001',
      'user_4002',
    ]));

    const booking = bookings.body.data.find((entry: { id: string }) => entry.id === 'booking_6001');
    const disputeBooking = bookings.body.data.find((entry: { id: string }) => entry.id === 'booking_6002');
    const seededCase = cases.body.data.find((entry: { id: string }) => entry.id === 'case_8001');
    const hearing = hearings.body.data.find((entry: { id: string }) => entry.id === 'hearing_10001');
    const award = awards.body.data.find((entry: { id: string }) => entry.id === 'award_12001');

    expect(booking).toEqual(expect.objectContaining({
      customerId: 'user_2001',
      providerId: 'user_3001',
      status: 'confirmed',
      escrowStatus: 'funds_locked',
    }));
    expect(new Date(booking.scheduledAt).getTime()).toBeGreaterThan(new Date(DEMO_SEED_NOW).getTime());
    expect(disputeBooking).toEqual(expect.objectContaining({
      customerId: 'user_2002',
      providerId: 'user_3002',
      status: 'disputed',
    }));
    expect(seededCase).toEqual(expect.objectContaining({
      bookingId: 'booking_6002',
      arbitratorId: 'user_4001',
      status: 'hearing_scheduled',
    }));
    expect(new Date(hearing.scheduledAt).getTime()).toBeGreaterThan(new Date(DEMO_SEED_NOW).getTime());
    expect(award).toEqual(expect.objectContaining({
      caseId: 'case_8001',
      status: 'draft',
      decision: 'refund_to_customer',
    }));
  });

  it('accepts an evaluation clock and enforces the escrow expiry boundary', async () => {
    let evaluationNow = new Date('2026-09-15T09:00:00.000Z');
    const store = app!.get(StoreService);
    store.setClockForTests(() => evaluationNow);

    const seeded = await request(app!.getHttpServer())
      .get('/api/v1/bookings')
      .set(adminHeaders)
      .expect(200);
    const booking = seeded.body.data.find((entry: { id: string }) => entry.id === 'booking_6001');
    expect(new Date(booking.createdAt).toISOString()).toBe(evaluationNow.toISOString());
    expect(new Date(booking.scheduledAt).getTime()).toBe(evaluationNow.getTime() + 24 * 60 * 60 * 1000);

    evaluationNow = new Date('2026-09-19T08:59:59.999Z');
    const beforeBoundary = await request(app!.getHttpServer())
      .post('/api/v1/bookings/workflow-cleanup')
      .set(adminHeaders)
      .expect(201);

    expect(beforeBoundary.body.data).toEqual({
      abandonedBookingsCancelled: 0,
      escrowBookingsAutoReleased: 0,
    });

    evaluationNow = new Date('2026-09-19T09:00:00.001Z');
    const afterBoundary = await request(app!.getHttpServer())
      .post('/api/v1/bookings/workflow-cleanup')
      .set(adminHeaders)
      .expect(201);

    expect(afterBoundary.body.data).toEqual({
      abandonedBookingsCancelled: 0,
      escrowBookingsAutoReleased: 1,
    });
  });
});
