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
        getTracker: (request: Record<string, any>) => String(request.ip || 'unknown-client'),
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
