import { IsDateString, IsOptional } from 'class-validator';

export class CreateClientSessionDto {
  @IsDateString()
  startAt: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;
}
