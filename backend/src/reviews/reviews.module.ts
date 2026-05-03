import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestActor } from '../common/interfaces/request-actor.interface';
import { Role } from '../store/entities';
import { StoreService } from '../store/store.service';

class CreateReviewDto {
  @IsString()
  bookingId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

@Injectable()
class ReviewsService {
  constructor(private readonly storeService: StoreService) {}

  listReviews(actor: RequestActor, filters: { serviceId?: string; providerId?: string; customerId?: string }) {
    return this.storeService.listReviews(actor, filters);
  }

  createReview(actor: RequestActor, payload: CreateReviewDto) {
    return this.storeService.createReview(actor, payload);
  }
}

@Controller('reviews')
class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  listReviews(
    @Req() req: { actor: RequestActor },
    @Query('serviceId') serviceId?: string,
    @Query('providerId') providerId?: string,
    @Query('customerId') customerId?: string,
  ) {
    return {
      data: this.reviewsService.listReviews(req.actor, { serviceId, providerId, customerId }),
    };
  }

  @Roles(Role.CUSTOMER)
  @Post()
  createReview(@Req() req: { actor: RequestActor }, @Body() payload: CreateReviewDto) {
    return {
      data: this.reviewsService.createReview(req.actor, payload),
      message: 'Review submitted successfully.',
    };
  }
}

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
