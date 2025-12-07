import { IsEnum } from 'class-validator';
import { SessionStatus } from '@prisma/client';

export class UpdateSessionStatusDto {
  @IsEnum(SessionStatus)
  status: SessionStatus;
}
