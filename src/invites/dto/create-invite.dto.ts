import { IsOptional, IsString, IsInt, Min, Max, IsEmail } from 'class-validator';

export class CreateInviteDto {
  @IsOptional()
  @IsEmail()
  clientEmail?: string;

  @IsOptional()
  @IsString()
  clientFirstName?: string;

  @IsOptional()
  @IsString()
  clientLastName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  expiresInDays?: number; // Default: 30 days
}
