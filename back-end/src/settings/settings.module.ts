import { Body, Controller, Get, Injectable, Module, Patch, Req } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestActor } from '../common/interfaces/request-actor.interface';
import { Role } from '../store/entities';
import { StoreService } from '../store/store.service';

enum TwoFactorSetting {
  ENABLED = 'Enabled',
  DISABLED = 'Disabled',
}

class GeneralSettingsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

class ArbitrationSettingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxResolutionTime?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  defaultHearingDuration?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxFileSize?: number;

  @IsOptional()
  @IsString()
  allowedFileTypes?: string;
}

class UserManagementSettingsDto {
  @IsOptional()
  @IsBoolean()
  allowNewUserRegistrations?: boolean;

  @IsOptional()
  @IsBoolean()
  requireEmailVerification?: boolean;

  @IsOptional()
  @IsBoolean()
  allowArbitratorApplications?: boolean;
}

class NotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailNewCases?: boolean;

  @IsOptional()
  @IsBoolean()
  hearingReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  awardIssued?: boolean;
}

class SecuritySettingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(6)
  minPasswordLength?: number;

  @IsOptional()
  @IsEnum(TwoFactorSetting)
  twoFactorAuth?: TwoFactorSetting;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(5)
  sessionTimeout?: number;
}

class UpdateSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => GeneralSettingsDto)
  general?: GeneralSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ArbitrationSettingsDto)
  arbitration?: ArbitrationSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserManagementSettingsDto)
  userManagement?: UserManagementSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications?: NotificationSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SecuritySettingsDto)
  security?: SecuritySettingsDto;
}

@Injectable()
class SettingsService {
  constructor(private readonly storeService: StoreService) {}

  getSettings(actor: RequestActor) {
    return this.storeService.getSettings(actor);
  }

  updateSettings(actor: RequestActor, payload: UpdateSettingsDto) {
    return this.storeService.updateSettings(actor, payload);
  }
}

@Roles(Role.ADMIN)
@Controller('settings')
class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings(@Req() req: { actor: RequestActor }) {
    return {
      data: this.settingsService.getSettings(req.actor),
    };
  }

  @Patch()
  updateSettings(@Req() req: { actor: RequestActor }, @Body() payload: UpdateSettingsDto) {
    return {
      data: this.settingsService.updateSettings(req.actor, payload),
      message: 'Settings updated successfully.',
    };
  }
}

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
