import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        display_name: true,
        currency: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    return {
      ...user,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    };
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.display_name && { display_name: dto.display_name }),
        ...(dto.currency && { currency: dto.currency }),
      },
      select: {
        id: true,
        email: true,
        display_name: true,
        currency: true,
        created_at: true,
        updated_at: true,
      },
    });

    return {
      ...updated,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  }
}
