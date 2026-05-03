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
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestActor } from '../common/interfaces/request-actor.interface';
import { ApplicationStatus, Role } from '../store/entities';
import { StoreService } from '../store/store.service';

const HUMAN_NAME_PATTERN = /^[A-Za-z]+(?:[ '.-][A-Za-z]+)*$/;
const HUMAN_NAME_MESSAGE = 'Name must contain letters only, with optional spaces, apostrophes, periods, or hyphens.';

class RegisterCustomerDto {
  @IsString()
  @MinLength(2)
  @Matches(HUMAN_NAME_PATTERN, { message: HUMAN_NAME_MESSAGE })
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredCategories?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(400)
  bio?: string;
}

class RegisterProviderDto {
  @IsString()
  @MinLength(2)
  @Matches(HUMAN_NAME_PATTERN, { message: HUMAN_NAME_MESSAGE })
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(2)
  businessName!: string;

  @IsString()
  @MinLength(2)
  category!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  serviceArea?: string;

  @IsOptional()
  @IsString()
  experienceLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  bio?: string;
}

class ApplyArbitratorDto {
  @IsString()
  @MinLength(2)
  @Matches(HUMAN_NAME_PATTERN, { message: HUMAN_NAME_MESSAGE })
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(2)
  specialization!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  experienceYears!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}

class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @Matches(HUMAN_NAME_PATTERN, { message: HUMAN_NAME_MESSAGE })
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredCategories?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(400)
  bio?: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  serviceArea?: string;

  @IsOptional()
  @IsString()
  experienceLevel?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @IsOptional()
  @IsString()
  title?: string;
}

class UpdateUserDto extends UpdateMeDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  approvalStatus?: ApplicationStatus;
}

@Injectable()
class UsersService {
  constructor(private readonly storeService: StoreService) {}

  registerCustomer(payload: RegisterCustomerDto) {
    return this.storeService.registerCustomer(payload);
  }

  registerProvider(payload: RegisterProviderDto) {
    return this.storeService.registerProvider(payload);
  }

  applyArbitrator(payload: ApplyArbitratorDto) {
    return this.storeService.applyArbitrator(payload);
  }

  getMe(actor: RequestActor) {
    return this.storeService.getMe(actor);
  }

  listUsers(actor: RequestActor, role?: Role, q?: string) {
    return this.storeService.listUsers(actor, { role, q });
  }

  updateMe(actor: RequestActor, payload: UpdateMeDto) {
    return this.storeService.updateMe(actor, payload);
  }

  updateUser(actor: RequestActor, userId: string, payload: UpdateUserDto) {
    return this.storeService.updateUser(actor, userId, payload);
  }
}

@Controller('customers')
class CustomersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post('register')
  register(@Body() payload: RegisterCustomerDto) {
    return {
      data: this.usersService.registerCustomer(payload),
      message: 'Customer registered successfully.',
    };
  }
}

@Controller('providers')
class ProvidersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post('register')
  register(@Body() payload: RegisterProviderDto) {
    return {
      data: this.usersService.registerProvider(payload),
      message: 'Provider registered successfully.',
    };
  }
}

@Controller('arbitrators')
class ArbitratorsController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post('applications')
  apply(@Body() payload: ApplyArbitratorDto) {
    return {
      data: this.usersService.applyArbitrator(payload),
      message: 'Arbitrator application received.',
    };
  }
}

@Controller('users')
class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: { actor: RequestActor }) {
    return {
      data: this.usersService.getMe(req.actor),
    };
  }

  @Patch('me')
  updateMe(@Req() req: { actor: RequestActor }, @Body() payload: UpdateMeDto) {
    return {
      data: this.usersService.updateMe(req.actor, payload),
      message: 'Profile updated successfully.',
    };
  }

  @Roles(Role.ADMIN)
  @Get()
  listUsers(
    @Req() req: { actor: RequestActor },
    @Query('role') role?: Role,
    @Query('q') q?: string,
  ) {
    return {
      data: this.usersService.listUsers(req.actor, role, q),
    };
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  updateUser(
    @Req() req: { actor: RequestActor },
    @Param('id') userId: string,
    @Body() payload: UpdateUserDto,
  ) {
    return {
      data: this.usersService.updateUser(req.actor, userId, payload),
      message: 'User updated successfully.',
    };
  }
}

@Module({
  controllers: [CustomersController, ProvidersController, ArbitratorsController, UsersController],
  providers: [UsersService],
})
export class UsersModule {}
