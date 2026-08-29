import { randomUUID } from 'crypto';
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { RequestWithContext } from '../interfaces/request-with-context.interface';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,64}$/;

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestContextMiddleware.name);

  use(request: RequestWithContext, response: {
    statusCode: number;
    setHeader(name: string, value: string): void;
    on(event: string, listener: () => void): void;
  }, next: () => void) {
    const incoming = request.headers['x-request-id'];
    const candidate = Array.isArray(incoming) ? incoming[0] : incoming;
    const requestId = typeof candidate === 'string' && REQUEST_ID_PATTERN.test(candidate)
      ? candidate
      : randomUUID();

    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);
    const startedAt = Date.now();

    response.on('finish', () => {
      const path = String(request.originalUrl || request.url || '').split('?')[0];
      this.logger.log(`${request.method} ${path} ${response.statusCode} ${Date.now() - startedAt}ms requestId=${requestId}`);
    });

    next();
  }
}
