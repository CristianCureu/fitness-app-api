import { IsArray, IsEnum } from 'class-validator';

enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export class UpdateTrainingDaysDto {
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  trainingDays: DayOfWeek[];
}
