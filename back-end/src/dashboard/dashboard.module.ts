import { Controller, Get, Injectable, Module, Req } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestActor } from '../common/interfaces/request-actor.interface';
import { Role } from '../store/entities';
import { StoreService } from '../store/store.service';

@Injectable()
class DashboardService {
  constructor(private readonly storeService: StoreService) {}

  getDashboard(actor: RequestActor) {
    return this.storeService.getDashboard(actor);
  }
}

@Controller('dashboard')
class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles(Role.CUSTOMER)
  @Get('customer')
  customer(@Req() req: { actor: RequestActor }) {
    return {
      data: this.dashboardService.getDashboard(req.actor),
    };
  }

  @Roles(Role.PROVIDER)
  @Get('provider')
  provider(@Req() req: { actor: RequestActor }) {
    return {
      data: this.dashboardService.getDashboard(req.actor),
    };
  }

  @Roles(Role.ADMIN)
  @Get('admin')
  admin(@Req() req: { actor: RequestActor }) {
    return {
      data: this.dashboardService.getDashboard(req.actor),
    };
  }

  @Roles(Role.ARBITRATOR)
  @Get('arbitrator')
  arbitrator(@Req() req: { actor: RequestActor }) {
    return {
      data: this.dashboardService.getDashboard(req.actor),
    };
  }
}

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
