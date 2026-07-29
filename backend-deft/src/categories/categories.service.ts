import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const categories = await this.prisma.category.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'asc' },
    });

    return categories.map((c) => ({
      ...c,
      created_at: c.created_at.toISOString(),
      updated_at: c.updated_at.toISOString(),
    }));
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const category = await this.prisma.category.create({
      data: {
        user_id: userId,
        name: dto.name,
        type: dto.type,
        icon: dto.icon || 'circle',
      },
    });

    return {
      ...category,
      created_at: category.created_at.toISOString(),
      updated_at: category.updated_at.toISOString(),
    };
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }
    if (category.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa danh mục này');
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
      },
    });

    return {
      ...updated,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  }

  async remove(userId: string, id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
            budgets: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }
    if (category.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xoá danh mục này');
    }

    if (category._count.transactions > 0 || category._count.budgets > 0) {
      throw new ConflictException(
        `Không thể xoá danh mục đã có ${category._count.transactions} giao dịch hoặc ngân sách tham chiếu. Hãy xoá các giao dịch liên quan trước.`,
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });
  }
}
