import { PartialType } from '@nestjs/mapped-types';
import { CreateSessionDto } from './create-session.dto';
import { OmitType } from '@nestjs/mapped-types';

export class UpdateSessionDto extends PartialType(
  OmitType(CreateSessionDto, ['clientId'] as const),
) {}
