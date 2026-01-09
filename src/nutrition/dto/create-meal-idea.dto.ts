import { ArrayMaxSize, IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { MealType } from '@prisma/client';

export class CreateMealIdeaDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(MealType)
  mealType: MealType;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  tags?: string[];
}
