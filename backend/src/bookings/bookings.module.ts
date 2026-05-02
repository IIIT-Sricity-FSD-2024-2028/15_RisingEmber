import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestActor } from '../common/interfaces/request-actor.interface';
import { BookingStatus, Role } from '../store/entities';
import { StoreService } from '../store/store.service';

class CreateBookingDto {
  @IsString()
  serviceId!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  address?: string;
}

class UpdateBookingDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellationReason?: string;
}

@Injectable()
class BookingsService {
  constructor(private readonly storeService: StoreService) {}

  listBookings(actor: RequestActor, filters: { status?: BookingStatus; serviceId?: string; caseLinked?: boolean }) {
    return this.storeService.listBookings(actor, filters);
  }

  getBooking(actor: RequestActor, bookingId: string) {
    return this.storeService.getBooking(actor, bookingId);
  }

  createBooking(actor: RequestActor, payload: CreateBookingDto) {
    return this.storeService.createBooking(actor, payload);
  }

  updateBooking(actor: RequestActor, bookingId: string, payload: UpdateBookingDto) {
    return this.storeService.updateBooking(actor, bookingId, payload);
  }
}

@Controller('bookings')
class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  listBookings(
    @Req() req: { actor: RequestActor },
    @Query('status') status?: BookingStatus,
    @Query('serviceId') serviceId?: string,
    @Query('caseLinked') caseLinked?: string,
  ) {
    return {
      data: this.bookingsService.listBookings(req.actor, {
        status,
        serviceId,
        caseLinked: caseLinked === undefined ? undefined : caseLinked === 'true',
      }),
    };
  }

  @Get(':id')
  getBooking(@Req() req: { actor: RequestActor }, @Param('id') id: string) {
    return {
      data: this.bookingsService.getBooking(req.actor, id),
    };
  }

  @Roles(Role.CUSTOMER)
  @Post()
  createBooking(@Req() req: { actor: RequestActor }, @Body() payload: CreateBookingDto) {
    return {
      data: this.bookingsService.createBooking(req.actor, payload),
      message: 'Booking created successfully.',
    };
  }

  @Patch(':id')
  updateBooking(
    @Req() req: { actor: RequestActor },
    @Param('id') id: string,
    @Body() payload: UpdateBookingDto,
  ) {
    return {
      data: this.bookingsService.updateBooking(req.actor, id, payload),
      message: 'Booking updated successfully.',
    };
  }
}

@Module({
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
