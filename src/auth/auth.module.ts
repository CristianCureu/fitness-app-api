import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [SupabaseModule, PrismaModule],
  providers: [AuthGuard, RolesGuard],
  exports: [AuthGuard, RolesGuard, SupabaseModule, PrismaModule],
})
export class AuthModule {}
