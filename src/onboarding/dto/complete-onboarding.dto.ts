import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsDateString,
  Min,
  Max,
  MinLength,
} from 'class-validator';

export class CompleteOnboardingDto {
  @IsString()
  @MinLength(1)
  inviteCode: string; // Required: invite code from trainer

  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @MinLength(1)
  lastName: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(250)
  height?: number; // cm

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  weight?: number; // kg

  @IsOptional()
  @IsString()
  goalDescription?: string;

  @IsOptional()
  @IsDateString()
  programStartDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  preferredSessionsPerWeek?: number; // Client's preference for sessions per week
}
