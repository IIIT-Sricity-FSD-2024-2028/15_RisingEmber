import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Req,
} from '@nestjs/common';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { RequestActor } from '../common/interfaces/request-actor.interface';
import { StoreService } from '../store/store.service';

class UpdateNotificationDto {
  @IsBoolean()
  read!: boolean;
}

class BulkUpdateNotificationsDto {
  @IsBoolean()
  read!: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ids?: string[];
}

@Injectable()
class NotificationsService {
  constructor(private readonly storeService: StoreService) {}

  listNotifications(actor: RequestActor) {
    return this.storeService.listNotifications(actor);
  }

  updateNotification(actor: RequestActor, notificationId: string, payload: UpdateNotificationDto) {
    return this.storeService.updateNotification(actor, notificationId, payload.read);
  }

  bulkUpdateNotifications(actor: RequestActor, payload: BulkUpdateNotificationsDto) {
    return this.storeService.bulkUpdateNotifications(actor, payload.read, payload.ids);
  }
}

@Controller('notifications')
class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  listNotifications(@Req() req: { actor: RequestActor }) {
    return {
      data: this.notificationsService.listNotifications(req.actor),
    };
  }

  @Patch(':id')
  updateNotification(
    @Req() req: { actor: RequestActor },
    @Param('id') id: string,
    @Body() payload: UpdateNotificationDto,
  ) {
    return {
      data: this.notificationsService.updateNotification(req.actor, id, payload),
      message: 'Notification updated successfully.',
    };
  }

  @Patch()
  bulkUpdateNotifications(@Req() req: { actor: RequestActor }, @Body() payload: BulkUpdateNotificationsDto) {
    return {
      data: this.notificationsService.bulkUpdateNotifications(req.actor, payload),
      message: 'Notifications updated successfully.',
    };
  }
}

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
