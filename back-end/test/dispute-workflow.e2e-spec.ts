import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { closeTestApp, createTestApp } from './test-app';
import { StoreService } from '../src/store/store.service';

const customerAHeaders = {
  'x-role': 'customer',
  'x-actor-id': 'user_2001',
};

const customerBHeaders = {
  'x-role': 'customer',
  'x-actor-id': 'user_2002',
};

const providerAHeaders = {
  'x-role': 'provider',
  'x-actor-id': 'user_3001',
};

const providerBHeaders = {
  'x-role': 'provider',
  'x-actor-id': 'user_3002',
};

const adminHeaders = {
  'x-role': 'admin',
  'x-actor-id': 'user_1001',
};

type ArbitratorHeaders = { 'x-role': 'arbitrator'; 'x-actor-id': string };

const arbitratorHeaders: ArbitratorHeaders = {
  'x-role': 'arbitrator',
  'x-actor-id': 'user_4001',
};

const arbitratorHeadersById: Record<string, ArbitratorHeaders> = {
  user_4001: arbitratorHeaders,
  user_4002: {
    'x-role': 'arbitrator',
    'x-actor-id': 'user_4002',
  },
};

describe('ServiceHub dispute and award workflow', () => {
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

  it('keeps the prepared case, hearing, and refund draft visible to every party', async () => {
    const [customerCase, providerCase, arbitratorCase, adminCase, hearing, award] = await Promise.all([
      request(app!.getHttpServer()).get('/api/v1/cases/case_8001').set(customerBHeaders).expect(200),
      request(app!.getHttpServer()).get('/api/v1/cases/case_8001').set(providerBHeaders).expect(200),
      request(app!.getHttpServer()).get('/api/v1/cases/case_8001').set(arbitratorHeaders).expect(200),
      request(app!.getHttpServer()).get('/api/v1/cases/case_8001').set(adminHeaders).expect(200),
      request(app!.getHttpServer()).get('/api/v1/hearings?caseId=case_8001').set(arbitratorHeaders).expect(200),
      request(app!.getHttpServer()).get('/api/v1/awards?caseId=case_8001').set(arbitratorHeaders).expect(200),
    ]);

    for (const response of [customerCase, providerCase, arbitratorCase, adminCase]) {
      expect(response.body.data).toEqual(expect.objectContaining({
        id: 'case_8001',
        bookingId: 'booking_6002',
        status: 'hearing_scheduled',
        arbitratorId: 'user_4001',
      }));
      expect(response.body.data.booking).toEqual(expect.objectContaining({
        status: 'disputed',
        escrowStatus: 'funds_locked',
      }));
    }

    expect(hearing.body.data).toEqual([
      expect.objectContaining({ id: 'hearing_10001', caseId: 'case_8001', status: 'scheduled' }),
    ]);
    expect(award.body.data).toEqual([
      expect.objectContaining({
        id: 'award_12001',
        caseId: 'case_8001',
        status: 'draft',
        decision: 'refund_to_customer',
      }),
    ]);
  });

  it('issues the prepared refund award exactly once and finalizes the disputed booking', async () => {
    const issued = await request(app!.getHttpServer())
      .patch('/api/v1/awards/award_12001')
      .set(arbitratorHeaders)
      .send({ status: 'issued' })
      .expect(200);

    expect(issued.body.data).toEqual(expect.objectContaining({
      id: 'award_12001',
      status: 'issued',
      decision: 'refund_to_customer',
    }));

    const booking = await request(app!.getHttpServer())
      .get('/api/v1/bookings/booking_6002')
      .set(customerBHeaders)
      .expect(200);
    expect(booking.body.data).toEqual(expect.objectContaining({
      status: 'cancelled',
      escrowStatus: 'refunded',
      cancellationReason: 'Refunded by arbitrator award.',
    }));

    const resolvedCase = await request(app!.getHttpServer())
      .get('/api/v1/cases/case_8001')
      .set(adminHeaders)
      .expect(200);
    expect(resolvedCase.body.data).toEqual(expect.objectContaining({
      status: 'resolved',
      resolutionSummary: 'Awaiting hearing before final award is issued.',
    }));

    await request(app!.getHttpServer())
      .patch('/api/v1/awards/award_12001')
      .set(arbitratorHeaders)
      .send({ status: 'issued', decision: 'release_to_provider' })
      .expect(409);
  });

  it('supports the release award path with hearing, evidence review, and cross-role messaging', async () => {
    const createdCase = await request(app!.getHttpServer())
      .post('/api/v1/cases')
      .set(customerAHeaders)
      .send({
        bookingId: 'booking_6001',
        title: 'Cleaning quality dispute',
        description: 'The customer reports that the agreed cleaning scope was not completed.',
        priority: 'high',
      })
      .expect(201);
    const caseId = createdCase.body.data.id;
    const assignedArbitratorId = createdCase.body.data.arbitratorId as string;
    const assignedArbitratorHeaders = arbitratorHeadersById[assignedArbitratorId];
    expect(assignedArbitratorHeaders).toBeDefined();
    expect(createdCase.body.data).toEqual(expect.objectContaining({
      status: 'assigned',
      bookingId: 'booking_6001',
      arbitratorId: assignedArbitratorId,
    }));
    expect(createdCase.body.data.messages.filter((message: { message: string }) => (
      message.message === 'The customer reports that the agreed cleaning scope was not completed.'
    ))).toHaveLength(1);

    await request(app!.getHttpServer())
      .patch(`/api/v1/cases/${caseId}`)
      .set(assignedArbitratorHeaders)
      .send({ status: 'under_review' })
      .expect(200);

    const hearing = await request(app!.getHttpServer())
      .post('/api/v1/hearings')
      .set(assignedArbitratorHeaders)
      .send({
        caseId,
        scheduledAt: '2026-09-04T10:00:00.000Z',
        type: 'video',
        agenda: 'Review the cleaning checklist and provider response.',
        notes: 'Both parties will attend remotely.',
      })
      .expect(201);
    expect(hearing.body.data).toEqual(expect.objectContaining({
      caseId,
      status: 'scheduled',
      type: 'video',
    }));

    await request(app!.getHttpServer())
      .patch(`/api/v1/hearings/${hearing.body.data.id}`)
      .set(assignedArbitratorHeaders)
      .send({ status: 'completed' })
      .expect(200);

    const beforeMessage = await request(app!.getHttpServer())
      .get(`/api/v1/cases/${caseId}`)
      .set(customerAHeaders)
      .expect(200);
    const beforeMessageCount = beforeMessage.body.data.messages.length;

    await request(app!.getHttpServer())
      .patch(`/api/v1/cases/${caseId}`)
      .set(assignedArbitratorHeaders)
      .send({ message: 'The hearing record has been reviewed and the provider response is on file.' })
      .expect(200);

    const afterMessage = await request(app!.getHttpServer())
      .get(`/api/v1/cases/${caseId}`)
      .set(providerAHeaders)
      .expect(200);
    expect(afterMessage.body.data.messages).toHaveLength(beforeMessageCount + 1);
    expect(afterMessage.body.data.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({
        authorId: assignedArbitratorId,
        message: 'The hearing record has been reviewed and the provider response is on file.',
      }),
    ]));

    const issued = await request(app!.getHttpServer())
      .post('/api/v1/awards')
      .set(assignedArbitratorHeaders)
      .send({
        caseId,
        title: 'Cleaning service award',
        summary: 'The provider may retain payment after the hearing review.',
        status: 'issued',
        decision: 'release_to_provider',
      })
      .expect(201);
    expect(issued.body.data).toEqual(expect.objectContaining({
      caseId,
      status: 'issued',
      decision: 'release_to_provider',
    }));

    const finalizedBooking = await request(app!.getHttpServer())
      .get('/api/v1/bookings/booking_6001')
      .set(providerAHeaders)
      .expect(200);
    expect(finalizedBooking.body.data).toEqual(expect.objectContaining({
      status: 'completed',
      escrowStatus: 'released',
    }));

    const adminView = await request(app!.getHttpServer())
      .get(`/api/v1/cases/${caseId}`)
      .set(adminHeaders)
      .expect(200);
    expect(adminView.body.data).toEqual(expect.objectContaining({ status: 'resolved' }));

    await request(app!.getHttpServer())
      .patch(`/api/v1/awards/${issued.body.data.id}`)
      .set(assignedArbitratorHeaders)
      .send({ status: 'issued', decision: 'refund_to_customer' })
      .expect(409);
  });
});
