import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { closeTestApp, createTestApp } from './test-app';
import { StoreService } from '../src/store/store.service';

const customerHeaders = {
  'x-role': 'customer',
  'x-actor-id': 'user_2002',
};

const assignedArbitratorHeaders = {
  'x-role': 'arbitrator',
  'x-actor-id': 'user_4001',
};

const unassignedArbitratorHeaders = {
  'x-role': 'arbitrator',
  'x-actor-id': 'user_4002',
};

function pdfDataUrl(byteCount: number) {
  return `data:application/pdf;base64,${Buffer.alloc(byteCount, 0x41).toString('base64')}`;
}

function pngDataUrl(byteCount: number) {
  return `data:image/png;base64,${Buffer.alloc(byteCount, 0x42).toString('base64')}`;
}

describe('ServiceHub document upload contract', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    jest.setTimeout(60_000);
    app = await createTestApp();
  });

  beforeEach(() => {
    app!.get(StoreService).setClockForTests(() => new Date('2026-09-01T09:00:00.000Z'));
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('accepts a small valid PDF data URL and exposes metadata to the assigned arbitrator', async () => {
    const response = await request(app!.getHttpServer())
      .post('/api/v1/documents')
      .set(customerHeaders)
      .send({
        caseId: 'case_8001',
        title: 'Additional leakage evidence',
        description: 'A short evidence attachment for the prepared dispute.',
        type: 'evidence',
        fileName: 'additional-evidence.pdf',
        content: pdfDataUrl(32),
      })
      .expect(201);

    expect(response.body.data).toEqual(expect.objectContaining({
      caseId: 'case_8001',
      type: 'evidence',
      fileName: 'additional-evidence.pdf',
      status: 'uploaded',
    }));

    const visible = await request(app!.getHttpServer())
      .get('/api/v1/documents?caseId=case_8001')
      .set(assignedArbitratorHeaders)
      .expect(200);
    expect(visible.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ fileName: 'additional-evidence.pdf', caseId: 'case_8001' }),
    ]));
  });

  it('accepts a decoded 25 MiB boundary file without allowing a larger file', async () => {
    await request(app!.getHttpServer())
      .post('/api/v1/documents')
      .set(customerHeaders)
      .send({
        caseId: 'case_8001',
        title: 'Boundary evidence file',
        type: 'evidence',
        fileName: 'boundary.pdf',
        content: pdfDataUrl(25 * 1024 * 1024),
      })
      .expect(201);

    await request(app!.getHttpServer())
      .post('/api/v1/documents')
      .set(customerHeaders)
      .send({
        caseId: 'case_8001',
        title: 'Oversized evidence file',
        type: 'evidence',
        fileName: 'oversized.pdf',
        content: pdfDataUrl(25 * 1024 * 1024 + 1),
      })
      .expect(400);
  });

  it('rejects malformed base64, unsupported MIME types, mismatched file names, and non-party actors', async () => {
    await request(app!.getHttpServer())
      .post('/api/v1/documents')
      .set(customerHeaders)
      .send({
        caseId: 'case_8001',
        title: 'Malformed evidence',
        type: 'evidence',
        fileName: 'malformed.pdf',
        content: 'data:application/pdf;base64,not$$$',
      })
      .expect(400);

    await request(app!.getHttpServer())
      .post('/api/v1/documents')
      .set(customerHeaders)
      .send({
        caseId: 'case_8001',
        title: 'Unsupported evidence',
        type: 'evidence',
        fileName: 'unsupported.zip',
        content: 'data:application/zip;base64,UEs=',
      })
      .expect(400);

    await request(app!.getHttpServer())
      .post('/api/v1/documents')
      .set(customerHeaders)
      .send({
        caseId: 'case_8001',
        title: 'Mismatched evidence',
        type: 'evidence',
        fileName: 'mismatched.png',
        content: pdfDataUrl(16),
      })
      .expect(400);

    await request(app!.getHttpServer())
      .post('/api/v1/documents')
      .set(unassignedArbitratorHeaders)
      .send({
        caseId: 'case_8001',
        title: 'Unauthorized evidence',
        type: 'evidence',
        fileName: 'unauthorized.pdf',
        content: pdfDataUrl(16),
      })
      .expect(403);
  });

  it('validates the complete stored document state on content and filename patches', async () => {
    const pngDocument = await request(app!.getHttpServer())
      .post('/api/v1/documents')
      .set(customerHeaders)
      .send({
        caseId: 'case_8001',
        title: 'PNG evidence',
        type: 'evidence',
        fileName: 'evidence.png',
        content: pngDataUrl(16),
      })
      .expect(201);

    const pdfDocument = await request(app!.getHttpServer())
      .post('/api/v1/documents')
      .set(customerHeaders)
      .send({
        caseId: 'case_8001',
        title: 'PDF evidence',
        type: 'evidence',
        fileName: 'evidence.pdf',
        content: pdfDataUrl(16),
      })
      .expect(201);

    await request(app!.getHttpServer())
      .patch(`/api/v1/documents/${pngDocument.body.data.id}`)
      .set(customerHeaders)
      .send({ content: pdfDataUrl(16) })
      .expect(400);

    await request(app!.getHttpServer())
      .patch(`/api/v1/documents/${pdfDocument.body.data.id}`)
      .set(customerHeaders)
      .send({ fileName: 'renamed.png' })
      .expect(400);

    await request(app!.getHttpServer())
      .patch(`/api/v1/documents/${pdfDocument.body.data.id}`)
      .set(customerHeaders)
      .send({ fileName: 'renamed.pdf' })
      .expect(200);
  });
});
