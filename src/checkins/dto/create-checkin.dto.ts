import { IsInt, IsBoolean, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateCheckinDto {
  @IsInt()
  @Min(0)
  @Max(10)
  nutritionScore: number;

  @IsBoolean()
  painAtTraining: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}
