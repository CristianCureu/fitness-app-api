import { IsOptional, IsDateString, IsString, IsEnum } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SessionStatus } from '@prisma/client';

export class QuerySessionsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;
}
