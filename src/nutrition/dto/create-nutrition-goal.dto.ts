import { IsString, IsInt, IsDateString, Min } from 'class-validator';

export class CreateNutritionGoalDto {
  @IsString()
  clientId: string;

  @IsDateString()
  weekStartDate: string; // Should be a Monday

  @IsInt()
  @Min(0)
  proteinTargetPerDay: number;

  @IsInt()
  @Min(0)
  waterTargetMlPerDay: number;

  @IsString()
  weeklyFocus: string;
}
