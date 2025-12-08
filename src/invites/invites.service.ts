import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInviteDto } from './dto/create-invite.dto';

@Injectable()
export class InvitesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a unique invite code
   * Format: TRAIN-ABC123 (6 random alphanumeric characters)
   */
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'TRAIN-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate a unique code with database uniqueness check
   */
  private async generateUniqueCode(): Promise<string> {
    let code: string = '';
    let exists = true;

    // Keep generating until we find a unique code
    while (exists) {
      code = this.generateInviteCode();
      const found = await this.prisma.inviteCode.findUnique({
        where: { code },
      });
      exists = !!found;
    }

    return code;
  }

  /**
   * Create a new invite code
   * Only trainers can create invites
   */
  async create(trainerId: string, dto: CreateInviteDto) {
    const code = await this.generateUniqueCode();

    const expiresInDays = dto.expiresInDays || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    return this.prisma.inviteCode.create({
      data: {
        code,
        trainerId,
        clientEmail: dto.clientEmail,
        clientFirstName: dto.clientFirstName,
        clientLastName: dto.clientLastName,
        expiresAt,
      },
      select: {
        id: true,
        code: true,
        clientEmail: true,
        clientFirstName: true,
        clientLastName: true,
        used: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get all invite codes for a trainer
   */
  async findAll(trainerId: string) {
    const invites = await this.prisma.inviteCode.findMany({
      where: { trainerId },
      include: {
        usedBy: {
          select: {
            id: true,
            clientProfile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { invites };
  }

  /**
   * Get a single invite code
   */
  async findOne(id: string, trainerId: string) {
    const invite = await this.prisma.inviteCode.findUnique({
      where: { id },
      include: {
        usedBy: {
          select: {
            id: true,
            clientProfile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite code not found');
    }

    if (invite.trainerId !== trainerId) {
      throw new ForbiddenException('You can only access your own invite codes');
    }

    return invite;
  }

  /**
   * Delete an invite code
   * Can only delete if not used
   */
  async remove(id: string, trainerId: string) {
    const invite = await this.prisma.inviteCode.findUnique({
      where: { id },
    });

    if (!invite) {
      throw new NotFoundException('Invite code not found');
    }

    if (invite.trainerId !== trainerId) {
      throw new ForbiddenException('You can only delete your own invite codes');
    }

    if (invite.used) {
      throw new BadRequestException('Cannot delete a used invite code');
    }

    await this.prisma.inviteCode.delete({
      where: { id },
    });

    return { message: 'Invite code deleted successfully' };
  }

  /**
   * Validate an invite code (used by onboarding service)
   * Returns the invite if valid, throws otherwise
   */
  async validateInviteCode(code: string) {
    const invite = await this.prisma.inviteCode.findUnique({
      where: { code },
    });

    if (!invite) {
      throw new BadRequestException('Invalid invite code');
    }

    if (invite.used) {
      throw new BadRequestException('This invite code has already been used');
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestException('This invite code has expired');
    }

    return invite;
  }

  /**
   * Mark invite code as used
   */
  async markAsUsed(code: string, userId: string) {
    return this.prisma.inviteCode.update({
      where: { code },
      data: {
        used: true,
        usedByUserId: userId,
        usedAt: new Date(),
      },
    });
  }
}
