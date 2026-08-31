import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Injectable,
  Module,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Public } from '../common/decorators/public.decorator';
import { StoreService } from '../store/store.service';
import { Role } from '../store/entities';
import { RequestActor } from '../common/interfaces/request-actor.interface';

class LoginDto {
  @IsEnum(Role)
  role!: Role;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class ResetPasswordDto {
  @IsEnum(Role)
  role!: Role;

  @IsString()
  identifier!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  nextPassword!: string;
}

@Injectable()
class SessionService {
  constructor(private readonly storeService: StoreService) {}

  login(payload: LoginDto) {
    return this.storeService.login(payload.role, payload.email, payload.password);
  }

  resetPassword(payload: ResetPasswordDto) {
    return this.storeService.requestPasswordReset(payload.role, payload.identifier);
  }

  changePassword(actor: RequestActor, payload: ChangePasswordDto) {
    return this.storeService.changePassword(actor, payload.currentPassword, payload.nextPassword);
  }

  logout(actor: RequestActor) {
    return this.storeService.logoutSession(actor.sessionToken);
  }
}

@Controller('session')
class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Public()
  @Post('login')
  login(@Body() payload: LoginDto) {
    return {
      data: this.sessionService.login(payload),
      message: 'Login bootstrap successful.',
    };
  }

  @Public()
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('password-reset')
  resetPassword(@Body() payload: ResetPasswordDto) {
    return {
      data: this.sessionService.resetPassword(payload),
      message: 'If the account exists, password-reset assistance has been requested.',
    };
  }

  @Patch('password')
  changePassword(@Req() req: { actor: RequestActor }, @Body() payload: ChangePasswordDto) {
    return {
      data: this.sessionService.changePassword(req.actor, payload),
      message: 'Password changed successfully. Please sign in again.',
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Req() req: { actor: RequestActor }) {
    return {
      data: this.sessionService.logout(req.actor),
      message: 'Logged out successfully.',
    };
  }
}

@Module({
  controllers: [SessionController],
  providers: [SessionService],
})
export class SessionModule {}
