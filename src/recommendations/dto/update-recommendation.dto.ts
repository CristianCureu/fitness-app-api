import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateRecommendationDto } from './create-recommendation.dto';

export class UpdateRecommendationDto extends PartialType(
  OmitType(CreateRecommendationDto, ['clientId', 'date'] as const),
) {}
