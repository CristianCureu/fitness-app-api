import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateNutritionSettingsDto {
  @IsString()
  clientId: string;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsInt()
  @Min(0)
  proteinTargetPerDay: number;

  @IsInt()
  @Min(0)
  waterTargetMlPerDay: number;

  @IsOptional()
  @IsString()
  weeklyGoal1?: string;
}
