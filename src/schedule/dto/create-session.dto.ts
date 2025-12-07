import { IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';

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
}
