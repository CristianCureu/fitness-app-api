import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, type AppUser } from '@prisma/client';

@Controller('invites')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.TRAINER)
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post()
  create(@CurrentUser() user: AppUser, @Body() dto: CreateInviteDto) {
    return this.invitesService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AppUser) {
    return this.invitesService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.invitesService.findOne(id, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.invitesService.remove(id, user.id);
  }
}
