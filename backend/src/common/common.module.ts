import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './guards/roles.guard';
import { ActorContextGuard } from './guards/actor-context.guard';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [StoreModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ActorContextGuard,
    },
  ],
})
export class CommonModule {}
