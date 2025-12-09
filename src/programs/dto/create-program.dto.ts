import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProgramSessionDto {
  @IsInt()
  @Min(1)
  dayNumber: number;

  @IsString()
  name: string;

  @IsString()
  focus: string; // "UPPER", "LOWER", "FULL_BODY", "PUSH", "PULL", "LEGS"

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateProgramDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  @Max(7)
  sessionsPerWeek: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(52)
  durationWeeks?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProgramSessionDto)
  sessions: CreateProgramSessionDto[];
}
