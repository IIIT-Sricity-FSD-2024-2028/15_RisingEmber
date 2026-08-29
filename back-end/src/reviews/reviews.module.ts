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
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
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

  listReviews(actor: RequestActor | undefined, filters: { serviceId?: string; providerId?: string; customerId?: string }) {
    return this.storeService.listReviews(actor, filters);
  }

  createReview(actor: RequestActor, payload: CreateReviewDto) {
    return this.storeService.createReview(actor, payload);
  }

  deleteReview(actor: RequestActor, reviewId: string) {
    return this.storeService.deleteReview(actor, reviewId);
  }
}

@Controller('reviews')
class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  listReviews(
    @Req() req: { actor?: RequestActor },
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

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  deleteReview(@Req() req: { actor: RequestActor }, @Param('id') id: string) {
    return {
      data: this.reviewsService.deleteReview(req.actor, id),
      message: 'Review deleted successfully.',
    };
  }
}

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
