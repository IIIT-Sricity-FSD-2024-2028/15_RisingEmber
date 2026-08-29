import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { morganStream } from '../logger/winston-logger.service';


// Morgan token for request ID (set by RequestContextMiddleware)
morgan.token('request-id', (req: any) => req.requestId || '-');
morgan.token('actor-id', (req: any) => req.headers?.['x-actor-id'] || '-');
morgan.token('actor-role', (req: any) => req.headers?.['x-role'] || '-');

// Custom Morgan format: timestamp + method + url + status + response-time + requestId + actor
const HTTP_LOG_FORMAT =
  '[:date[iso]] :method :url :status :res[content-length]b :response-time ms requestId=:request-id role=:actor-role actor=:actor-id';

const morganMiddleware = morgan(HTTP_LOG_FORMAT, {
  stream: morganStream,
  // Skip logging for health checks to reduce noise
  skip: (req: Request) => req.url === '/api/v1/health',
});

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(HttpLoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    morganMiddleware(req, res, (err?: any) => {
      if (err) {
        this.logger.error(`Morgan middleware error: ${String(err)}`);
      }
      next();
    });
  }
}
