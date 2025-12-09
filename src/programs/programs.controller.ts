import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { GetProgramsQueryDto } from './dto/get-programs-query.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AppUser } from '@prisma/client';

@Controller('programs')
@UseGuards(AuthGuard, RolesGuard)
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  @Roles('TRAINER')
  create(@CurrentUser() user: AppUser, @Body() createProgramDto: CreateProgramDto) {
    return this.programsService.create(user.id, createProgramDto);
  }

  @Get()
  @Roles('TRAINER')
  findAll(@CurrentUser() user: AppUser, @Query() query: GetProgramsQueryDto) {
    return this.programsService.findAll(user.id, query);
  }

  @Get(':id')
  @Roles('TRAINER')
  findOne(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.programsService.findOne(id, user.id);
  }

  @Patch(':id')
  @Roles('TRAINER')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AppUser,
    @Body() updateProgramDto: UpdateProgramDto,
  ) {
    return this.programsService.update(id, user.id, updateProgramDto);
  }

  @Delete(':id')
  @Roles('TRAINER')
  remove(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.programsService.remove(id, user.id);
  }

  @Post(':id/clone')
  @Roles('TRAINER')
  clone(
    @Param('id') id: string,
    @CurrentUser() user: AppUser,
    @Body() body: { name?: string },
  ) {
    return this.programsService.clone(id, user.id, body.name);
  }
}
