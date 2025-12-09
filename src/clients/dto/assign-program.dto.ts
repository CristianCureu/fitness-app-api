import {
  IsString,
  IsDateString,
  IsArray,
  IsBoolean,
  IsOptional,
  IsEnum,
} from 'class-validator';

enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export class AssignProgramDto {
  @IsString()
  programId: string;

  @IsDateString()
  startDate: string;

  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  trainingDays: DayOfWeek[];

  @IsOptional()
  @IsBoolean()
  customize?: boolean; // if true, clone the program for this client
}
