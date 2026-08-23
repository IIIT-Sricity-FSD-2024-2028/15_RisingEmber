import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { closeTestApp, createTestApp } from './test-app';

const customerHeaders = {
  'x-role': 'customer',
  'x-actor-id': 'user_2001',
};

const otherCustomerHeaders = {
  'x-role': 'customer',
  'x-actor-id': 'user_2002',
};

const providerHeaders = {
  'x-role': 'provider',
  'x-actor-id': 'user_3001',
};

const otherProviderHeaders = {
  'x-role': 'provider',
  'x-actor-id': 'user_3002',
};

describe('ServiceHub marketplace golden workflow', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('publishes, books, progresses, completes, and reviews one service end to end', async () => {
    const serviceResponse = await request(app!.getHttpServer())
      .post('/api/v1/services')
      .set(providerHeaders)
      .send({
        title: 'Evaluation Home Refresh',
        description: 'A reliable home refresh package for the evaluation walkthrough.',
        category: 'Home Cleaning',
        price: 1800,
        durationMinutes: 120,
        location: 'Mumbai',
        tags: ['evaluation', 'home'],
      })
      .expect(201);
    const service = serviceResponse.body.data;

    expect(service).toEqual(expect.objectContaining({
      providerId: 'user_3001',
      title: 'Evaluation Home Refresh',
      status: 'active',
      currency: 'INR',
      rating: 4.8,
      reviewCount: 0,
    }));
    expect(service.id).toMatch(/^service_/);

    const publicServices = await request(app!.getHttpServer())
      .get(`/api/v1/services?providerId=${encodeURIComponent(service.providerId)}`)
      .expect(200);
    expect(publicServices.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: service.id, providerName: 'Rohan Verma' }),
    ]));

    const serviceDetails = await request(app!.getHttpServer())
      .get(`/api/v1/services/${service.id}`)
      .expect(200);
    expect(serviceDetails.body.data).toEqual(expect.objectContaining({ id: service.id, title: service.title }));

    const bookingResponse = await request(app!.getHttpServer())
      .post('/api/v1/bookings')
      .set(customerHeaders)
      .send({
        serviceId: service.id,
        scheduledAt: '2026-10-10T10:00:00.000Z',
        notes: 'Please bring the standard home refresh kit.',
        address: 'Powai, Mumbai, Building 7',
      })
      .expect(201);
    const booking = bookingResponse.body.data;

    expect(booking).toEqual(expect.objectContaining({
      serviceId: service.id,
      customerId: 'user_2001',
      providerId: 'user_3001',
      status: 'requested',
      escrowStatus: 'not_locked',
      totalAmount: 1800,
      currency: 'INR',
    }));
    expect(booking.id).toMatch(/^booking_/);

    const providerBookings = await request(app!.getHttpServer())
      .get(`/api/v1/bookings?serviceId=${encodeURIComponent(service.id)}`)
      .set(providerHeaders)
      .expect(200);
    expect(providerBookings.body.data).toEqual([
      expect.objectContaining({ id: booking.id, providerId: 'user_3001' }),
    ]);

    const customerBookings = await request(app!.getHttpServer())
      .get(`/api/v1/bookings?serviceId=${encodeURIComponent(service.id)}`)
      .set(customerHeaders)
      .expect(200);
    expect(customerBookings.body.data).toEqual([
      expect.objectContaining({ id: booking.id, customerId: 'user_2001' }),
    ]);

    const otherCustomerBookings = await request(app!.getHttpServer())
      .get(`/api/v1/bookings?serviceId=${encodeURIComponent(service.id)}`)
      .set(otherCustomerHeaders)
      .expect(200);
    expect(otherCustomerBookings.body.data).toEqual([]);

    const otherProviderBookings = await request(app!.getHttpServer())
      .get(`/api/v1/bookings?serviceId=${encodeURIComponent(service.id)}`)
      .set(otherProviderHeaders)
      .expect(200);
    expect(otherProviderBookings.body.data).toEqual([]);

    await request(app!.getHttpServer())
      .patch(`/api/v1/bookings/${booking.id}`)
      .set(otherProviderHeaders)
      .send({ status: 'confirmed' })
      .expect(403);

    await request(app!.getHttpServer())
      .patch(`/api/v1/bookings/${booking.id}`)
      .set(providerHeaders)
      .send({ status: 'in_progress' })
      .expect(409);

    const stillRequested = await request(app!.getHttpServer())
      .get(`/api/v1/bookings/${booking.id}`)
      .set(providerHeaders)
      .expect(200);
    expect(stillRequested.body.data).toEqual(expect.objectContaining({ status: 'requested', escrowStatus: 'not_locked' }));

    await request(app!.getHttpServer())
      .post('/api/v1/reviews')
      .set(customerHeaders)
      .send({ bookingId: booking.id, rating: 5, comment: 'Too early to review.' })
      .expect(409);

    const confirmed = await request(app!.getHttpServer())
      .patch(`/api/v1/bookings/${booking.id}`)
      .set(providerHeaders)
      .send({ status: 'confirmed', note: 'Provider confirmed the evaluation booking.' })
      .expect(200);
    expect(confirmed.body.data).toEqual(expect.objectContaining({ status: 'confirmed', escrowStatus: 'funds_locked' }));

    const inProgress = await request(app!.getHttpServer())
      .patch(`/api/v1/bookings/${booking.id}`)
      .set(providerHeaders)
      .send({ status: 'in_progress', note: 'Provider has started the service.' })
      .expect(200);
    expect(inProgress.body.data).toEqual(expect.objectContaining({ status: 'in_progress', escrowStatus: 'funds_locked' }));

    const completed = await request(app!.getHttpServer())
      .patch(`/api/v1/bookings/${booking.id}`)
      .set(providerHeaders)
      .send({ status: 'completed', note: 'Service completed successfully.' })
      .expect(200);
    expect(completed.body.data).toEqual(expect.objectContaining({ status: 'completed', escrowStatus: 'released' }));

    await request(app!.getHttpServer())
      .patch(`/api/v1/bookings/${booking.id}`)
      .set(providerHeaders)
      .send({ status: 'completed' })
      .expect(409);

    const unchangedCompleted = await request(app!.getHttpServer())
      .get(`/api/v1/bookings/${booking.id}`)
      .set(customerHeaders)
      .expect(200);
    expect(unchangedCompleted.body.data).toEqual(expect.objectContaining({ status: 'completed', escrowStatus: 'released' }));

    await request(app!.getHttpServer())
      .post('/api/v1/reviews')
      .set(customerHeaders)
      .send({ bookingId: booking.id, rating: 6, comment: 'Rating bounds must be enforced.' })
      .expect(400);

    const reviewResponse = await request(app!.getHttpServer())
      .post('/api/v1/reviews')
      .set(customerHeaders)
      .send({ bookingId: booking.id, rating: 5, comment: 'Excellent evaluation service.' })
      .expect(201);
    expect(reviewResponse.body.data).toEqual(expect.objectContaining({
      bookingId: booking.id,
      serviceId: service.id,
      customerId: 'user_2001',
      providerId: 'user_3001',
      rating: 5,
    }));

    await request(app!.getHttpServer())
      .post('/api/v1/reviews')
      .set(customerHeaders)
      .send({ bookingId: booking.id, rating: 4, comment: 'Duplicate review must be rejected.' })
      .expect(409);

    const reviews = await request(app!.getHttpServer())
      .get(`/api/v1/reviews?serviceId=${encodeURIComponent(service.id)}`)
      .expect(200);
    expect(reviews.body.data).toEqual([
      expect.objectContaining({ id: expect.stringMatching(/^review_/), bookingId: booking.id, rating: 5 }),
    ]);

    const updatedService = await request(app!.getHttpServer())
      .get(`/api/v1/services/${service.id}`)
      .expect(200);
    expect(updatedService.body.data).toEqual(expect.objectContaining({ rating: 5, reviewCount: 1 }));

    const providerProfile = await request(app!.getHttpServer())
      .get('/api/v1/users/me')
      .set(providerHeaders)
      .expect(200);
    expect(providerProfile.body.data.profile).toEqual(expect.objectContaining({ rating: 5 }));
  });
});
