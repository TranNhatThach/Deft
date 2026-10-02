import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertBudgetDto } from './dto/upsert-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { formatCurrency } from '../common/utils/currency.util';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  private async getUserCurrency(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true },
    });
    return user?.currency || 'VND';
  }

  async findOne(userId: string, id: string) {
    const [budget, currency] = await Promise.all([
      this.prisma.budget.findUnique({
        where: { id },
        include: { budget_period: true, category: true },
      }),
      this.getUserCurrency(userId),
    ]);

    if (!budget) {
      throw new NotFoundException('Ngân sách không tồn tại');
    }
    if (budget.budget_period.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập ngân sách này');
    }

    const limit = Number(budget.limit_amount);
    const spent = Number(budget.spent_amount);
    const remaining = limit - spent;

    return {
      id: budget.id,
      budget_period_id: budget.budget_period_id,
      category_id: budget.category_id,
      limit_amount: limit,
      spent_amount: spent,
      percent_used: limit > 0 ? Math.round((spent / limit) * 100) : 0,
      remaining_amount: remaining,
      formatted_limit: formatCurrency(limit, currency),
      formatted_spent: formatCurrency(spent, currency),
      formatted_remaining: formatCurrency(remaining, currency),
      category: budget.category
        ? {
            ...budget.category,
            created_at: budget.category.created_at.toISOString(),
            updated_at: budget.category.updated_at.toISOString(),
          }
        : undefined,
    };
  }

  async createBudget(userId: string, dto: CreateBudgetDto) {
    return this.upsertBudget(userId, dto.budget_period_id, {
      category_id: dto.category_id,
      limit_amount: dto.limit_amount,
    });
  }

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

    const currency = await this.getUserCurrency(userId);

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
    const remaining = limit - spent;

    return {
      id: budget.id,
      budget_period_id: budget.budget_period_id,
      category_id: budget.category_id,
      limit_amount: limit,
      spent_amount: spent,
      percent_used: limit > 0 ? Math.round((spent / limit) * 100) : 0,
      remaining_amount: remaining,
      formatted_limit: formatCurrency(limit, currency),
      formatted_spent: formatCurrency(spent, currency),
      formatted_remaining: formatCurrency(remaining, currency),
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

    const currency = await this.getUserCurrency(userId);

    const updated = await this.prisma.budget.update({
      where: { id },
      data: {
        limit_amount: dto.limit_amount,
      },
      include: { category: true },
    });

    const limit = Number(updated.limit_amount);
    const spent = Number(updated.spent_amount);
    const remaining = limit - spent;

    return {
      id: updated.id,
      budget_period_id: updated.budget_period_id,
      category_id: updated.category_id,
      limit_amount: limit,
      spent_amount: spent,
      percent_used: limit > 0 ? Math.round((spent / limit) * 100) : 0,
      remaining_amount: remaining,
      formatted_limit: formatCurrency(limit, currency),
      formatted_spent: formatCurrency(spent, currency),
      formatted_remaining: formatCurrency(remaining, currency),
      category: updated.category
        ? {
            ...updated.category,
            created_at: updated.category.created_at.toISOString(),
            updated_at: updated.category.updated_at.toISOString(),
          }
        : undefined,
    };
  }

  async remove(userId: string, id: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: { budget_period: true },
    });

    if (!budget) {
      throw new NotFoundException('Ngân sách không tồn tại');
    }
    if (budget.budget_period.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xoá ngân sách này');
    }

    await this.prisma.budget.delete({
      where: { id },
    });
  }
}
