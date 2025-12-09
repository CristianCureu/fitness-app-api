import { IsString, IsOptional, IsDateString, IsBoolean, IsEnum } from 'class-validator';
import { SessionStatus } from '@prisma/client';

export class CreateSessionDto {
  @IsString()
  clientId: string;

  @IsString()
  sessionName: string;

  @IsOptional()
  @IsString()
  sessionType?: string;

  @IsDateString()
  startAt: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsBoolean()
  autoRecommended?: boolean;

  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;
}
