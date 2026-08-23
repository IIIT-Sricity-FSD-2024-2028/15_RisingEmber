import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { closeTestApp, createTestApp } from './test-app';
import { StoreService } from '../src/store/store.service';

const adminHeaders = {
  'x-role': 'admin',
  'x-actor-id': 'user_1001',
};

const customerHeaders = {
  'x-role': 'customer',
  'x-actor-id': 'user_2002',
};

describe('ServiceHub admin operations', () => {
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

  it('lists the shared admin records and persists an admin user, case, and settings update', async () => {
    const [users, cases, hearings, documents, awards, settings] = await Promise.all([
      request(app!.getHttpServer()).get('/api/v1/users').set(adminHeaders).expect(200),
      request(app!.getHttpServer()).get('/api/v1/cases').set(adminHeaders).expect(200),
      request(app!.getHttpServer()).get('/api/v1/hearings').set(adminHeaders).expect(200),
      request(app!.getHttpServer()).get('/api/v1/documents').set(adminHeaders).expect(200),
      request(app!.getHttpServer()).get('/api/v1/awards').set(adminHeaders).expect(200),
      request(app!.getHttpServer()).get('/api/v1/settings').set(adminHeaders).expect(200),
    ]);

    expect(users.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'user_1001', role: 'admin' }),
    ]));
    expect(cases.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'case_8001', bookingId: 'booking_6002' }),
    ]));
    expect(hearings.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'hearing_10001', caseId: 'case_8001' }),
    ]));
    expect(documents.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'document_11001', caseId: 'case_8001' }),
    ]));
    expect(awards.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'award_12001', caseId: 'case_8001' }),
    ]));
    expect(settings.body.data).toEqual(expect.objectContaining({
      general: expect.objectContaining({ name: expect.any(String) }),
    }));

    const disabled = await request(app!.getHttpServer())
      .patch('/api/v1/users/user_4002')
      .set(adminHeaders)
      .send({ isActive: false })
      .expect(200);
    expect(disabled.body.data).toEqual(expect.objectContaining({ id: 'user_4002', isActive: false }));

    await request(app!.getHttpServer())
      .patch('/api/v1/users/user_4002')
      .set(adminHeaders)
      .send({ isActive: true })
      .expect(200);

    const updatedCase = await request(app!.getHttpServer())
      .patch('/api/v1/cases/case_8001')
      .set(adminHeaders)
      .send({ priority: 'medium' })
      .expect(200);
    expect(updatedCase.body.data).toEqual(expect.objectContaining({ id: 'case_8001', priority: 'medium' }));

    const originalSettings = settings.body.data;
    const updatedSettings = await request(app!.getHttpServer())
      .patch('/api/v1/settings')
      .set(adminHeaders)
      .send({ general: { phone: '1800-EVAL-ADMIN' } })
      .expect(200);
    expect(updatedSettings.body.data.general.phone).toBe('1800-EVAL-ADMIN');

    const restoredSettings = await request(app!.getHttpServer())
      .patch('/api/v1/settings')
      .set(adminHeaders)
      .send({ general: { phone: originalSettings.general.phone } })
      .expect(200);
    expect(restoredSettings.body.data.general.phone).toBe(originalSettings.general.phone);
  });

  it('lets an admin moderate a case message while a customer cannot use admin routes', async () => {
    const caseResponse = await request(app!.getHttpServer())
      .get('/api/v1/cases/case_8001')
      .set(adminHeaders)
      .expect(200);
    const messageId = caseResponse.body.data.messages[0].id as string;

    const updatedMessage = await request(app!.getHttpServer())
      .patch(`/api/v1/cases/case_8001/messages/${messageId}`)
      .set(adminHeaders)
      .send({ flagged: true, reviewed: true })
      .expect(200);
    expect(updatedMessage.body.data).toEqual(expect.objectContaining({
      id: messageId,
      flagged: true,
      reviewed: true,
    }));

    await request(app!.getHttpServer())
      .patch(`/api/v1/cases/case_8001/messages/${messageId}`)
      .set(adminHeaders)
      .send({ flagged: false, reviewed: false })
      .expect(200);

    await request(app!.getHttpServer())
      .get('/api/v1/users')
      .set(customerHeaders)
      .expect(403);
    await request(app!.getHttpServer())
      .patch('/api/v1/settings')
      .set(customerHeaders)
      .send({ general: { name: 'Unauthorized' } })
      .expect(403);
    await request(app!.getHttpServer())
      .patch(`/api/v1/cases/case_8001/messages/${messageId}`)
      .set(customerHeaders)
      .send({ flagged: true })
      .expect(403);
  });
});
