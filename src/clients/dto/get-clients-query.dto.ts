import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ClientStatus } from '@prisma/client';

export class GetClientsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  // Search parameter - searches in firstName, lastName
  @IsOptional()
  @IsString()
  search?: string;

  // Filter by client status
  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;

  // Filter by onboarding completion
  @IsOptional()
  @Type(() => Boolean)
  onboardingCompleted?: boolean;
}
