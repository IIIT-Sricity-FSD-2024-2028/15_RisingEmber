import {
  Body,
  Controller,
  Delete,
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
import { RequestActor } from '../common/interfaces/request-actor.interface';
import { HearingStatus, HearingType } from '../store/entities';
import { StoreService } from '../store/store.service';

class CreateHearingDto {
  @IsString()
  caseId!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsEnum(HearingType)
  type!: HearingType;

  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  agenda!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

class UpdateHearingDto {
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsEnum(HearingType)
  type?: HearingType;

  @IsOptional()
  @IsEnum(HearingStatus)
  status?: HearingStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  agenda?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

@Injectable()
class HearingsService {
  constructor(private readonly storeService: StoreService) {}

  listHearings(actor: RequestActor, filters: { caseId?: string; status?: HearingStatus }) {
    return this.storeService.listHearings(actor, filters);
  }

  createHearing(actor: RequestActor, payload: CreateHearingDto) {
    return this.storeService.createHearing(actor, payload);
  }

  updateHearing(actor: RequestActor, hearingId: string, payload: UpdateHearingDto) {
    return this.storeService.updateHearing(actor, hearingId, payload);
  }

  deleteHearing(actor: RequestActor, hearingId: string) {
    return this.storeService.deleteHearing(actor, hearingId);
  }
}

@Controller('hearings')
class HearingsController {
  constructor(private readonly hearingsService: HearingsService) {}

  @Get()
  listHearings(
    @Req() req: { actor: RequestActor },
    @Query('caseId') caseId?: string,
    @Query('status') status?: HearingStatus,
  ) {
    return {
      data: this.hearingsService.listHearings(req.actor, { caseId, status }),
    };
  }

  @Post()
  createHearing(@Req() req: { actor: RequestActor }, @Body() payload: CreateHearingDto) {
    return {
      data: this.hearingsService.createHearing(req.actor, payload),
      message: 'Hearing created successfully.',
    };
  }

  @Patch(':id')
  updateHearing(
    @Req() req: { actor: RequestActor },
    @Param('id') id: string,
    @Body() payload: UpdateHearingDto,
  ) {
    return {
      data: this.hearingsService.updateHearing(req.actor, id, payload),
      message: 'Hearing updated successfully.',
    };
  }

  @Delete(':id')
  deleteHearing(@Req() req: { actor: RequestActor }, @Param('id') id: string) {
    return {
      data: this.hearingsService.deleteHearing(req.actor, id),
      message: 'Hearing deleted successfully.',
    };
  }
}

@Module({
  controllers: [HearingsController],
  providers: [HearingsService],
})
export class HearingsModule {}
