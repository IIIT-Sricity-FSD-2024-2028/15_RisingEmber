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
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestActor } from '../common/interfaces/request-actor.interface';
import { CaseStatus, Role } from '../store/entities';
import { StoreService } from '../store/store.service';

class CreateCaseDto {
  @IsString()
  bookingId!: string;

  @IsString()
  @MinLength(5)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  @IsEnum({ low: 'low', medium: 'medium', high: 'high' })
  priority?: 'low' | 'medium' | 'high';
}

class UpdateCaseDto {
  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;

  @IsOptional()
  @IsString()
  arbitratorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolutionSummary?: string;

  @IsOptional()
  @IsEnum({ low: 'low', medium: 'medium', high: 'high' })
  priority?: 'low' | 'medium' | 'high';
}

class UpdateCaseMessageDto {
  @IsOptional()
  @IsBoolean()
  flagged?: boolean;

  @IsOptional()
  @IsBoolean()
  reviewed?: boolean;
}

@Injectable()
class CasesService {
  constructor(private readonly storeService: StoreService) {}

  listCases(actor: RequestActor, filters: { status?: CaseStatus; bookingId?: string; arbitratorId?: string }) {
    return this.storeService.listCases(actor, filters);
  }

  getCase(actor: RequestActor, caseId: string) {
    return this.storeService.getCase(actor, caseId);
  }

  createCase(actor: RequestActor, payload: CreateCaseDto) {
    return this.storeService.createCase(actor, payload);
  }

  updateCase(actor: RequestActor, caseId: string, payload: UpdateCaseDto) {
    return this.storeService.updateCase(actor, caseId, payload);
  }

  deleteCase(actor: RequestActor, caseId: string) {
    return this.storeService.deleteCase(actor, caseId);
  }

  updateCaseMessage(actor: RequestActor, caseId: string, messageId: string, payload: UpdateCaseMessageDto) {
    return this.storeService.updateCaseMessage(actor, caseId, messageId, payload);
  }

  deleteCaseMessage(actor: RequestActor, caseId: string, messageId: string) {
    return this.storeService.deleteCaseMessage(actor, caseId, messageId);
  }
}

@Controller('cases')
class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  listCases(
    @Req() req: { actor: RequestActor },
    @Query('status') status?: CaseStatus,
    @Query('bookingId') bookingId?: string,
    @Query('arbitratorId') arbitratorId?: string,
  ) {
    return {
      data: this.casesService.listCases(req.actor, { status, bookingId, arbitratorId }),
    };
  }

  @Get(':id')
  getCase(@Req() req: { actor: RequestActor }, @Param('id') id: string) {
    return {
      data: this.casesService.getCase(req.actor, id),
    };
  }

  @Post()
  createCase(@Req() req: { actor: RequestActor }, @Body() payload: CreateCaseDto) {
    return {
      data: this.casesService.createCase(req.actor, payload),
      message: 'Case created successfully.',
    };
  }

  @Patch(':id')
  updateCase(@Req() req: { actor: RequestActor }, @Param('id') id: string, @Body() payload: UpdateCaseDto) {
    return {
      data: this.casesService.updateCase(req.actor, id, payload),
      message: 'Case updated successfully.',
    };
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  deleteCase(@Req() req: { actor: RequestActor }, @Param('id') id: string) {
    return {
      data: this.casesService.deleteCase(req.actor, id),
      message: 'Case deleted successfully.',
    };
  }

  @Roles(Role.ADMIN)
  @Patch(':id/messages/:messageId')
  updateCaseMessage(
    @Req() req: { actor: RequestActor },
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Body() payload: UpdateCaseMessageDto,
  ) {
    return {
      data: this.casesService.updateCaseMessage(req.actor, id, messageId, payload),
      message: 'Case message updated successfully.',
    };
  }

  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Delete(':id/messages/:messageId')
  deleteCaseMessage(
    @Req() req: { actor: RequestActor },
    @Param('id') id: string,
    @Param('messageId') messageId: string,
  ) {
    return {
      data: this.casesService.deleteCaseMessage(req.actor, id, messageId),
      message: 'Case message deleted successfully.',
    };
  }
}

@Module({
  controllers: [CasesController],
  providers: [CasesService],
})
export class CasesModule {}
