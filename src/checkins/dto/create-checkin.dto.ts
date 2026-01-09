import { IsInt, IsBoolean, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateCheckinDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  nutritionScore?: number;

  @IsOptional()
  @IsBoolean()
  painAtTraining?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}
