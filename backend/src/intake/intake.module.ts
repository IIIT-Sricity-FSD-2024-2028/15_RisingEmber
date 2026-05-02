import { Body, Controller, Injectable, Module, Post } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Public } from '../common/decorators/public.decorator';
import { StoreService } from '../store/store.service';

const HUMAN_NAME_PATTERN = /^[A-Za-z]+(?:[ '.-][A-Za-z]+)*$/;
const HUMAN_NAME_MESSAGE = 'Name must contain letters only, with optional spaces, apostrophes, periods, or hyphens.';

class CreateJobRequestDto {
  @IsString()
  @MinLength(2)
  @Matches(HUMAN_NAME_PATTERN, { message: HUMAN_NAME_MESSAGE })
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(2)
  serviceCategory!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1500)
  description!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budget?: number;
}

class CreateContactMessageDto {
  @IsString()
  @MinLength(2)
  @Matches(HUMAN_NAME_PATTERN, { message: HUMAN_NAME_MESSAGE })
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(2)
  subject!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1500)
  message!: string;
}

class CreateWaitlistEntryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @Matches(HUMAN_NAME_PATTERN, { message: HUMAN_NAME_MESSAGE })
  name?: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  city?: string;

  @IsOptional()
  @IsString()
  serviceCategory?: string;
}

@Injectable()
class IntakeService {
  constructor(private readonly storeService: StoreService) {}

  createJobRequest(payload: CreateJobRequestDto) {
    return this.storeService.createJobRequest(payload);
  }

  createContactMessage(payload: CreateContactMessageDto) {
    return this.storeService.createContactMessage(payload);
  }

  createWaitlistEntry(payload: CreateWaitlistEntryDto) {
    return this.storeService.createWaitlistEntry(payload);
  }
}

@Controller('intake')
class IntakeController {
  constructor(private readonly intakeService: IntakeService) {}

  @Public()
  @Post('job-requests')
  createJobRequest(@Body() payload: CreateJobRequestDto) {
    return {
      data: this.intakeService.createJobRequest(payload),
      message: 'Job request submitted successfully.',
    };
  }

  @Public()
  @Post('contact-messages')
  createContactMessage(@Body() payload: CreateContactMessageDto) {
    return {
      data: this.intakeService.createContactMessage(payload),
      message: 'Contact message submitted successfully.',
    };
  }

  @Public()
  @Post('waitlist')
  createWaitlistEntry(@Body() payload: CreateWaitlistEntryDto) {
    return {
      data: this.intakeService.createWaitlistEntry(payload),
      message: 'Waitlist entry submitted successfully.',
    };
  }
}

@Module({
  controllers: [IntakeController],
  providers: [IntakeService],
})
export class IntakeModule {}
