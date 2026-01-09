import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class MealIdeasDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  preferences?: string[];

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(6)
  mealsPerDay?: number;
}
