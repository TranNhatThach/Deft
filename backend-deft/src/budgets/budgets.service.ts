import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertBudgetDto } from './dto/upsert-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async upsertBudget(userId: string, periodId: string, dto: UpsertBudgetDto) {
    const period = await this.prisma.budgetPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      throw new NotFoundException('Kỳ ngân sách không tồn tại');
    }
    if (period.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền quản lý kỳ ngân sách này');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: dto.category_id },
    });

    if (!category || category.user_id !== userId) {
      throw new NotFoundException('Danh mục không tồn tại hoặc không thuộc quyền quản lý');
    }

    // Calculate existing spent_amount from transactions in this period for category
    const spentResult = await this.prisma.transaction.aggregate({
      where: {
        budget_period_id: periodId,
        category_id: dto.category_id,
        type: 'expense',
      },
      _sum: { amount: true },
    });

    const currentSpent = Number(spentResult._sum.amount || 0);

    const budget = await this.prisma.budget.upsert({
      where: {
        budget_period_id_category_id: {
          budget_period_id: periodId,
          category_id: dto.category_id,
        },
      },
      update: {
        limit_amount: dto.limit_amount,
        spent_amount: currentSpent,
      },
      create: {
        budget_period_id: periodId,
        category_id: dto.category_id,
        limit_amount: dto.limit_amount,
        spent_amount: currentSpent,
      },
      include: { category: true },
    });

    const limit = Number(budget.limit_amount);
    const spent = Number(budget.spent_amount);

    return {
      id: budget.id,
      budget_period_id: budget.budget_period_id,
      category_id: budget.category_id,
      limit_amount: limit,
      spent_amount: spent,
      percent_used: limit > 0 ? Math.round((spent / limit) * 100) : 0,
      remaining_amount: limit - spent,
      category: budget.category
        ? {
            ...budget.category,
            created_at: budget.category.created_at.toISOString(),
            updated_at: budget.category.updated_at.toISOString(),
          }
        : undefined,
    };
  }

  async updateBudget(userId: string, id: string, dto: UpdateBudgetDto) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: { budget_period: true, category: true },
    });

    if (!budget) {
      throw new NotFoundException('Ngân sách không tồn tại');
    }
    if (budget.budget_period.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa ngân sách này');
    }

    const updated = await this.prisma.budget.update({
      where: { id },
      data: {
        limit_amount: dto.limit_amount,
      },
      include: { category: true },
    });

    const limit = Number(updated.limit_amount);
    const spent = Number(updated.spent_amount);

    return {
      id: updated.id,
      budget_period_id: updated.budget_period_id,
      category_id: updated.category_id,
      limit_amount: limit,
      spent_amount: spent,
      percent_used: limit > 0 ? Math.round((spent / limit) * 100) : 0,
      remaining_amount: limit - spent,
      category: updated.category
        ? {
            ...updated.category,
            created_at: updated.category.created_at.toISOString(),
            updated_at: updated.category.updated_at.toISOString(),
          }
        : undefined,
    };
  }
}
