import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ClientStatus } from '@prisma/client';

export class UpdateMyProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

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
  height?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  weight?: number;

  @IsOptional()
  @IsString()
  goalDescription?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  recommendedSessionsPerWeek?: number;

  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;

  @IsOptional()
  @IsString()
  pushToken?: string;

  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pushSessionReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  pushDailyTips?: boolean;

  @IsOptional()
  @IsBoolean()
  pushWeeklyMessage?: boolean;
}
