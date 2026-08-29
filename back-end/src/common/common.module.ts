import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { RolesGuard } from './guards/roles.guard';
import { ActorContextGuard } from './guards/actor-context.guard';
import { PublicThrottlerGuard } from './guards/public-throttler.guard';
import { RequestContextMiddleware } from './middleware/request-context.middleware';
import { HttpLoggerMiddleware } from './middleware/http-logger.middleware';
import { RouteAuditMiddleware } from './middleware/route-audit.middleware';
import { DocumentUploadMiddleware } from './middleware/document-upload.middleware';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [
    StoreModule,
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [{
          name: 'default',
          limit: Number(process.env.THROTTLE_LIMIT || 30),
          ttl: Number(process.env.THROTTLE_TTL_MS || 60_000),
          setHeaders: true,
        }],
        // Keep abuse counters independent per public route so a burst of bad
        // logins cannot starve unrelated public intake forms for the same
        // client. The path is query-free and therefore safe to use as a key.
        getTracker: (request: Record<string, any>) => (
          `${String(request.ip || 'unknown-client')}:${String(request.path || request.url || 'unknown-route')}`
        ),
        errorMessage: 'Too many requests. Please retry shortly.',
      }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ActorContextGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PublicThrottlerGuard,
    },
  ],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 1. RequestContextMiddleware — Global: every route gets a requestId and latency log
    consumer
      .apply(RequestContextMiddleware)
      .forRoutes('*');

    // 2. HttpLoggerMiddleware — Global: Morgan writes HTTP traffic to rotating log files
    consumer
      .apply(HttpLoggerMiddleware)
      .forRoutes('*');

    // 3. RouteAuditMiddleware — Router-level: only sensitive transaction routes
    //    Logs all state-changing operations (POST/PATCH/DELETE) on:
    //    bookings, cases, awards, hearings
    consumer
      .apply(RouteAuditMiddleware)
      .forRoutes(
        { path: 'bookings', method: RequestMethod.ALL },
        { path: 'bookings/*path', method: RequestMethod.ALL },
        { path: 'cases', method: RequestMethod.ALL },
        { path: 'cases/*path', method: RequestMethod.ALL },
        { path: 'awards', method: RequestMethod.ALL },
        { path: 'awards/*path', method: RequestMethod.ALL },
        { path: 'hearings', method: RequestMethod.ALL },
        { path: 'hearings/*path', method: RequestMethod.ALL },
      );

    // 4. DocumentUploadMiddleware — Router-level: only /documents routes
    //    Validates content-type and payload size before body parsing
    consumer
      .apply(DocumentUploadMiddleware)
      .forRoutes(
        { path: 'documents', method: RequestMethod.ALL },
        { path: 'documents/*path', method: RequestMethod.ALL },
      );
  }
}
