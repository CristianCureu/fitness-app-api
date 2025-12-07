import { PartialType } from '@nestjs/mapped-types';
import { CreateClientProfileDto } from './create-client-profile.dto';
import { OmitType } from '@nestjs/mapped-types';

// Omit userId since it can't be changed after creation
export class UpdateClientProfileDto extends PartialType(
  OmitType(CreateClientProfileDto, ['userId'] as const),
) {}
