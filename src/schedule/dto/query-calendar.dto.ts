import { IsDateString } from 'class-validator';

export class QueryCalendarDto {
  @IsDateString()
  date: string; // ISO date string (e.g., "2025-12-22")
}
