import { IsString, MinLength } from 'class-validator';

export class ValidateInviteDto {
  @IsString()
  @MinLength(1)
  inviteCode: string;
}
