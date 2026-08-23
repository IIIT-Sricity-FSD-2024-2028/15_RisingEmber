import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { RolesGuard } from './guards/roles.guard';
import { ActorContextGuard } from './guards/actor-context.guard';
import { PublicThrottlerGuard } from './guards/public-throttler.guard';
import { RequestContextMiddleware } from './middleware/request-context.middleware';
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
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
