import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateNutritionGoalDto } from './create-nutrition-goal.dto';

export class UpdateNutritionGoalDto extends PartialType(
  OmitType(CreateNutritionGoalDto, ['clientId', 'weekStartDate'] as const),
) {}
