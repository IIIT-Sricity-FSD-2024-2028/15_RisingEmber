import { Controller, Get, Module } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
class HealthController {
  @Public()
  @Get()
  getHealth() {
    return { status: 'ok' };
  }
}

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
