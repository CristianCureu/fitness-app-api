import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateRecommendationDto {
  @IsString()
  clientId: string;

  @IsDateString()
  date: string;

  @IsString()
  focusText: string;

  @IsOptional()
  @IsString()
  tipsText?: string;

  @IsOptional()
  @IsBoolean()
  hasWorkoutToday?: boolean;
}
