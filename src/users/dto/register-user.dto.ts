import { IsUUID } from 'class-validator';

export class RegisterUserDto {
  @IsUUID()
  authId: string; // Supabase auth.users.id
}
