import { PartialType } from '@nestjs/mapped-types';
import { CreateNutritionTipDto } from './create-nutrition-tip.dto';

export class UpdateNutritionTipDto extends PartialType(CreateNutritionTipDto) {}
