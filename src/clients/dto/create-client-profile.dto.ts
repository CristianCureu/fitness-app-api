import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ClientStatus } from '@prisma/client';

export class CreateClientProfileDto {
  @IsString()
  userId: string; // AppUser ID for the client

  @IsString()
  firstName: string;

  @IsString()
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
  @IsEnum(ClientStatus)
  status?: ClientStatus;

  @IsOptional()
  @IsDateString()
  programStartDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(52)
  programWeeks?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  recommendedSessionsPerWeek?: number;
}
