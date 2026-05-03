import { Body, Controller, Injectable, Module, Post } from '@nestjs/common';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Public } from '../common/decorators/public.decorator';
import { StoreService } from '../store/store.service';
import { Role } from '../store/entities';

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

@Injectable()
class SessionService {
  constructor(private readonly storeService: StoreService) {}

  login(payload: LoginDto) {
    return this.storeService.login(payload.role, payload.email, payload.password);
  }

  resetPassword(payload: ResetPasswordDto) {
    return this.storeService.resetPassword(payload.role, payload.identifier, payload.password);
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
  @Post('password-reset')
  resetPassword(@Body() payload: ResetPasswordDto) {
    return {
      data: this.sessionService.resetPassword(payload),
      message: 'Password reset successfully.',
    };
  }
}

@Module({
  controllers: [SessionController],
  providers: [SessionService],
})
export class SessionModule {}
