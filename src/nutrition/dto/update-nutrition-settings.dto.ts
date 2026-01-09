import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateNutritionSettingsDto } from './create-nutrition-settings.dto';

export class UpdateNutritionSettingsDto extends PartialType(
  OmitType(CreateNutritionSettingsDto, ['clientId'] as const),
) {}
