import { PartialType } from '@nestjs/mapped-types';
import { CreateMealIdeaDto } from './create-meal-idea.dto';

export class UpdateMealIdeaDto extends PartialType(CreateMealIdeaDto) {}
