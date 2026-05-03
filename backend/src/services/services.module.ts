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
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestActor } from '../common/interfaces/request-actor.interface';
import { Role, ServiceStatus } from '../store/entities';
import { StoreService } from '../store/store.service';

class CreateServiceDto {
  @IsOptional()
  @IsString()
  providerId?: string;

  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description!: string;

  @IsString()
  @MinLength(2)
  category!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(15)
  durationMinutes!: number;

  @IsString()
  @MinLength(2)
  location!: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;
}

class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(15)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;
}

@Injectable()
class ServicesService {
  constructor(private readonly storeService: StoreService) {}

  listServices(filters: { category?: string; providerId?: string; status?: ServiceStatus; q?: string }, actor?: RequestActor) {
    return this.storeService.listServices(filters, actor);
  }

  getServiceById(serviceId: string) {
    return this.storeService.getServiceById(serviceId);
  }

  createService(actor: RequestActor, payload: CreateServiceDto) {
    return this.storeService.createService(actor, payload);
  }

  updateService(actor: RequestActor, serviceId: string, payload: UpdateServiceDto) {
    return this.storeService.updateService(actor, serviceId, payload);
  }

  deleteService(actor: RequestActor, serviceId: string) {
    return this.storeService.deleteService(actor, serviceId);
  }
}

@Controller('services')
class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Public()
  @Get()
  listServices(
    @Query('category') category?: string,
    @Query('providerId') providerId?: string,
    @Query('status') status?: ServiceStatus,
    @Query('q') q?: string,
  ) {
    return {
      data: this.servicesService.listServices({ category, providerId, status, q }),
    };
  }

  @Public()
  @Get(':id')
  getService(@Param('id') id: string) {
    return {
      data: this.servicesService.getServiceById(id),
    };
  }

  @Roles(Role.PROVIDER, Role.ADMIN)
  @Post()
  createService(@Req() req: { actor: RequestActor }, @Body() payload: CreateServiceDto) {
    return {
      data: this.servicesService.createService(req.actor, payload),
      message: 'Service created successfully.',
    };
  }

  @Roles(Role.PROVIDER, Role.ADMIN)
  @Patch(':id')
  updateService(
    @Req() req: { actor: RequestActor },
    @Param('id') id: string,
    @Body() payload: UpdateServiceDto,
  ) {
    return {
      data: this.servicesService.updateService(req.actor, id, payload),
      message: 'Service updated successfully.',
    };
  }

  @Roles(Role.PROVIDER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  deleteService(@Req() req: { actor: RequestActor }, @Param('id') id: string) {
    return {
      data: this.servicesService.deleteService(req.actor, id),
      message: 'Service deleted successfully.',
    };
  }
}

@Module({
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule {}
