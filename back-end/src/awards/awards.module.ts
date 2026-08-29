import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { RequestActor } from '../common/interfaces/request-actor.interface';
import { AwardDecision, AwardStatus } from '../store/entities';
import { StoreService } from '../store/store.service';

class CreateAwardDto {
  @IsString()
  caseId!: string;

  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  summary!: string;

  @IsOptional()
  @IsEnum(AwardStatus)
  status?: AwardStatus;

  @IsOptional()
  @IsEnum(AwardDecision)
  decision?: AwardDecision;
}

class UpdateAwardDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  summary?: string;

  @IsOptional()
  @IsEnum(AwardStatus)
  status?: AwardStatus;

  @IsOptional()
  @IsEnum(AwardDecision)
  decision?: AwardDecision;
}

@Injectable()
class AwardsService {
  constructor(private readonly storeService: StoreService) {}

  listAwards(actor: RequestActor, filters: { caseId?: string; status?: AwardStatus }) {
    return this.storeService.listAwards(actor, filters);
  }

  createAward(actor: RequestActor, payload: CreateAwardDto) {
    return this.storeService.createAward(actor, payload);
  }

  updateAward(actor: RequestActor, awardId: string, payload: UpdateAwardDto) {
    return this.storeService.updateAward(actor, awardId, payload);
  }

  deleteAward(actor: RequestActor, awardId: string) {
    return this.storeService.deleteAward(actor, awardId);
  }
}

@Controller('awards')
class AwardsController {
  constructor(private readonly awardsService: AwardsService) {}

  @Get()
  listAwards(
    @Req() req: { actor: RequestActor },
    @Query('caseId') caseId?: string,
    @Query('status') status?: AwardStatus,
  ) {
    return {
      data: this.awardsService.listAwards(req.actor, { caseId, status }),
    };
  }

  @Post()
  createAward(@Req() req: { actor: RequestActor }, @Body() payload: CreateAwardDto) {
    return {
      data: this.awardsService.createAward(req.actor, payload),
      message: 'Award created successfully.',
    };
  }

  @Patch(':id')
  updateAward(@Req() req: { actor: RequestActor }, @Param('id') id: string, @Body() payload: UpdateAwardDto) {
    return {
      data: this.awardsService.updateAward(req.actor, id, payload),
      message: 'Award updated successfully.',
    };
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  deleteAward(@Req() req: { actor: RequestActor }, @Param('id') id: string) {
    return {
      data: this.awardsService.deleteAward(req.actor, id),
      message: 'Award deleted successfully.',
    };
  }
}

@Module({
  controllers: [AwardsController],
  providers: [AwardsService],
})
export class AwardsModule {}
