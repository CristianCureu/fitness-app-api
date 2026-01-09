import { IsEnum, IsOptional, IsString } from 'class-validator';
import { NutritionTipScope } from '@prisma/client';

export class CreateNutritionTipDto {
  @IsEnum(NutritionTipScope)
  scope: NutritionTipScope;

  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  goalTag?: string;

  @IsOptional()
  @IsString()
  clientId?: string;
}
