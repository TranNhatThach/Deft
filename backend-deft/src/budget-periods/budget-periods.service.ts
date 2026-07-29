import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetPeriodDto } from './dto/create-budget-period.dto';

@Injectable()
export class BudgetPeriodsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const periods = await this.prisma.budgetPeriod.findMany({
      where: { user_id: userId },
      orderBy: { start_date: 'desc' },
    });

    return periods.map((p) => ({
      ...p,
      total_limit: Number(p.total_limit),
      start_date: p.start_date.toISOString().split('T')[0],
      end_date: p.end_date.toISOString().split('T')[0],
      created_at: p.created_at.toISOString(),
    }));
  }

  async getCurrent(userId: string) {
    const current = await this.prisma.budgetPeriod.findFirst({
      where: { user_id: userId, status: 'open' },
      orderBy: { created_at: 'desc' },
    });

    if (!current) {
      return null;
    }

    return {
      ...current,
      total_limit: Number(current.total_limit),
      start_date: current.start_date.toISOString().split('T')[0],
      end_date: current.end_date.toISOString().split('T')[0],
      created_at: current.created_at.toISOString(),
    };
  }

  async create(userId: string, dto: CreateBudgetPeriodDto) {
    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);

    if (startDate >= endDate) {
      throw new BadRequestException('start_date phải trước end_date');
    }

    // Auto-close previous open periods for user
    await this.prisma.budgetPeriod.updateMany({
      where: { user_id: userId, status: 'open' },
      data: { status: 'closed' },
    });

    const period = await this.prisma.budgetPeriod.create({
      data: {
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
        total_limit: dto.total_limit,
        status: 'open',
      },
    });

    return {
      ...period,
      total_limit: Number(period.total_limit),
      start_date: period.start_date.toISOString().split('T')[0],
      end_date: period.end_date.toISOString().split('T')[0],
      created_at: period.created_at.toISOString(),
    };
  }

  async closePeriod(userId: string, id: string) {
    const period = await this.prisma.budgetPeriod.findUnique({
      where: { id },
    });

    if (!period) {
      throw new NotFoundException('Kỳ ngân sách không tồn tại');
    }
    if (period.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền đóng kỳ ngân sách này');
    }

    const updated = await this.prisma.budgetPeriod.update({
      where: { id },
      data: { status: 'closed' },
    });

    return {
      ...updated,
      total_limit: Number(updated.total_limit),
      start_date: updated.start_date.toISOString().split('T')[0],
      end_date: updated.end_date.toISOString().split('T')[0],
      created_at: updated.created_at.toISOString(),
    };
  }

  async getBudgets(userId: string, periodId: string) {
    const period = await this.prisma.budgetPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      throw new NotFoundException('Kỳ ngân sách không tồn tại');
    }
    if (period.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập kỳ ngân sách này');
    }

    const budgets = await this.prisma.budget.findMany({
      where: { budget_period_id: periodId },
      include: { category: true },
    });

    return budgets.map((b) => {
      const limit = Number(b.limit_amount);
      const spent = Number(b.spent_amount);
      const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      return {
        id: b.id,
        budget_period_id: b.budget_period_id,
        category_id: b.category_id,
        limit_amount: limit,
        spent_amount: spent,
        percent_used: percent,
        remaining_amount: limit - spent,
        category: b.category
          ? {
              ...b.category,
              created_at: b.category.created_at.toISOString(),
              updated_at: b.category.updated_at.toISOString(),
            }
          : undefined,
      };
    });
  }

  async getSummary(userId: string, periodId: string) {
    const period = await this.prisma.budgetPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      throw new NotFoundException('Kỳ ngân sách không tồn tại');
    }
    if (period.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập kỳ ngân sách này');
    }

    const totalLimit = Number(period.total_limit);

    // Calculate total spent for period from transactions
    const totalSpentResult = await this.prisma.transaction.aggregate({
      where: {
        budget_period_id: periodId,
        type: 'expense',
      },
      _sum: { amount: true },
    });

    const totalSpent = Number(totalSpentResult._sum.amount || 0);
    const remaining = totalLimit - totalSpent;
    const percentUsed = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

    const budgets = await this.prisma.budget.findMany({
      where: { budget_period_id: periodId },
      include: { category: true },
    });

    const byCategory = budgets.map((b) => {
      const limit = Number(b.limit_amount);
      const spent = Number(b.spent_amount);
      const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      return {
        category_id: b.category_id,
        category_name: b.category?.name,
        category_icon: b.category?.icon || undefined,
        limit_amount: limit,
        spent_amount: spent,
        percent_used: percent,
      };
    });

    return {
      budget_period: {
        ...period,
        total_limit: totalLimit,
        start_date: period.start_date.toISOString().split('T')[0],
        end_date: period.end_date.toISOString().split('T')[0],
        created_at: period.created_at.toISOString(),
      },
      total_limit: totalLimit,
      total_spent: totalSpent,
      remaining,
      percent_used: percentUsed,
      by_category: byCategory,
    };
  }
}
