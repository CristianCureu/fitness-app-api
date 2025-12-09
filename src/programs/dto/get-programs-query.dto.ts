import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetProgramsQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeDefault?: boolean; // include default programs

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  onlyDefault?: boolean; // only default programs
}
