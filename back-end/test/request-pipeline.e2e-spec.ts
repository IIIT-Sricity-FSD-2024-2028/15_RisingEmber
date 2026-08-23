import { INestApplication, Logger } from '@nestjs/common';
import request from 'supertest';
import { closeTestApp, createTestApp } from './test-app';
import { StoreService } from '../src/store/store.service';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

const adminHeaders = {
  'x-role': 'admin',
  'x-actor-id': 'user_1001',
};

describe('ServiceHub request pipeline', () => {
  let app: INestApplication | undefined;
  const previousOrigins = process.env.FRONTEND_ORIGINS;
  const previousThrottleLimit = process.env.THROTTLE_LIMIT;
  const previousThrottleTtl = process.env.THROTTLE_TTL_MS;

  beforeAll(async () => {
    process.env.FRONTEND_ORIGINS = 'http://127.0.0.1:8080,http://localhost:8080';
    process.env.THROTTLE_LIMIT = '2';
    process.env.THROTTLE_TTL_MS = '60000';
    app = await createTestApp();
  });

  beforeEach(() => {
    app!.get(StoreService).setClockForTests(() => new Date('2026-09-01T09:00:00.000Z'));
  });

  afterAll(async () => {
    await closeTestApp(app);
    if (previousOrigins === undefined) delete process.env.FRONTEND_ORIGINS;
    else process.env.FRONTEND_ORIGINS = previousOrigins;
    if (previousThrottleLimit === undefined) delete process.env.THROTTLE_LIMIT;
    else process.env.THROTTLE_LIMIT = previousThrottleLimit;
    if (previousThrottleTtl === undefined) delete process.env.THROTTLE_TTL_MS;
    else process.env.THROTTLE_TTL_MS = previousThrottleTtl;
  });

  it('serves health, applies the CORS allow-list, and handles CLI requests', async () => {
    await request(app!.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect(({ body }) => expect(body).toEqual({ status: 'ok' }));

    const allowed = await request(app!.getHttpServer())
      .get('/api/v1/services')
      .set('Origin', 'http://127.0.0.1:8080')
      .expect(200);
    expect(allowed.headers['access-control-allow-origin']).toBe('http://127.0.0.1:8080');
    expect(allowed.headers['x-content-type-options']).toBe('nosniff');
    expect(allowed.headers['referrer-policy']).toBe('no-referrer');

    const rejected = await request(app!.getHttpServer())
      .get('/api/v1/services')
      .set('Origin', 'https://evil.example')
      .expect(403);
    expect(rejected.body).toEqual(expect.objectContaining({
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Origin is not allowed by the ServiceHub CORS policy.',
    }));

    await request(app!.getHttpServer())
      .get('/api/v1/services')
      .expect(200);
  });

  it('echoes a valid request ID, generates one when absent, and emits safe completion logs', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

    const supplied = await request(app!.getHttpServer())
      .get('/api/v1/services?search=private-value')
      .set('x-request-id', 'eval-request-42')
      .expect(200);
    expect(supplied.headers['x-request-id']).toBe('eval-request-42');

    const generated = await request(app!.getHttpServer())
      .get('/api/v1/services')
      .expect(200);
    expect(generated.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(generated.headers['x-request-id']).not.toBe('eval-request-42');

    const logOutput = logSpy.mock.calls.flat().map((entry) => String(entry)).join('\n');
    expect(logOutput).toContain('GET /api/v1/services');
    expect(logOutput).toContain('requestId=eval-request-42');
    expect(logOutput).not.toContain('private-value');
    logSpy.mockRestore();
  });

  it('returns normalized validation, not-found, and forbidden errors with trace IDs', async () => {
    const validation = await request(app!.getHttpServer())
      .post('/api/v1/session/login?password=do-not-log')
      .send({ role: 'admin', email: 'not-an-email', password: 'short' })
      .expect(400);
    expect(validation.body).toEqual(expect.objectContaining({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      path: '/api/v1/session/login',
      requestId: validation.headers['x-request-id'],
    }));
    expect(JSON.stringify(validation.body)).not.toContain('do-not-log');

    const notFound = await request(app!.getHttpServer())
      .get('/api/v1/services/missing-service')
      .set('x-request-id', 'not-found-request')
      .expect(404);
    expect(notFound.body).toEqual(expect.objectContaining({
      statusCode: 404,
      code: 'NOT_FOUND',
      requestId: 'not-found-request',
    }));

    const forbidden = await request(app!.getHttpServer())
      .get('/api/v1/users')
      .set({ 'x-role': 'customer', 'x-actor-id': 'user_2001' })
      .expect(403);
    expect(forbidden.body).toEqual(expect.objectContaining({
      statusCode: 403,
      code: 'FORBIDDEN',
      requestId: forbidden.headers['x-request-id'],
    }));
  });

  it('redacts unknown exception details in the filter response', () => {
    const filter = new AllExceptionsFilter();
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ method: 'GET', originalUrl: '/api/v1/internal?secret=password', requestId: 'internal-request' }),
      }),
    } as any;

    filter.catch(new Error('database password=super-secret'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error.',
      path: '/api/v1/internal',
      requestId: 'internal-request',
    }));
    expect(JSON.stringify(response.json.mock.calls[0][0])).not.toContain('super-secret');
  });

  it('throttles abuse-prone public login requests without blocking service reads', async () => {
    await closeTestApp(app);
    app = await createTestApp();

    const payload = {
      role: 'admin',
      email: 'admin@servicehub.test',
      password: 'wrong-password',
    };

    await request(app!.getHttpServer()).post('/api/v1/session/login').send(payload).expect(401);
    await request(app!.getHttpServer()).post('/api/v1/session/login').send(payload).expect(401);
    await request(app!.getHttpServer()).post('/api/v1/session/login').send(payload).expect(429);
    await request(app!.getHttpServer())
      .post('/api/v1/intake/waitlist')
      .send({ email: 'route-isolated-throttle@example.test' })
      .expect(201);
    await request(app!.getHttpServer()).get('/api/v1/services').expect(200);
    await request(app!.getHttpServer()).get('/api/v1/services').set(adminHeaders).expect(200);
  });
});
