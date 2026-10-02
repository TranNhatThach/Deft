import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetPeriodDto } from './dto/create-budget-period.dto';
import { UpdateBudgetPeriodDto } from './dto/update-budget-period.dto';
import { formatCurrency } from '../common/utils/currency.util';

@Injectable()
export class BudgetPeriodsService {
  constructor(private prisma: PrismaService) {}

  private async getUserCurrency(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true },
    });
    return user?.currency || 'VND';
  }

  async findAll(userId: string) {
    const [periods, currency] = await Promise.all([
      this.prisma.budgetPeriod.findMany({
        where: { user_id: userId },
        orderBy: { start_date: 'desc' },
      }),
      this.getUserCurrency(userId),
    ]);

    return periods.map((p) => {
      const totalLimit = Number(p.total_limit);
      return {
        ...p,
        total_limit: totalLimit,
        formatted_total_limit: formatCurrency(totalLimit, currency),
        start_date: p.start_date.toISOString().split('T')[0],
        end_date: p.end_date.toISOString().split('T')[0],
        created_at: p.created_at.toISOString(),
      };
    });
  }

  async getCurrent(userId: string) {
    const [current, currency] = await Promise.all([
      this.prisma.budgetPeriod.findFirst({
        where: { user_id: userId, status: 'open' },
        orderBy: { created_at: 'desc' },
      }),
      this.getUserCurrency(userId),
    ]);

    if (!current) {
      return null;
    }

    const totalLimit = Number(current.total_limit);
    return {
      ...current,
      total_limit: totalLimit,
      formatted_total_limit: formatCurrency(totalLimit, currency),
      start_date: current.start_date.toISOString().split('T')[0],
      end_date: current.end_date.toISOString().split('T')[0],
      created_at: current.created_at.toISOString(),
    };
  }

  async findOne(userId: string, id: string) {
    const [period, currency] = await Promise.all([
      this.prisma.budgetPeriod.findUnique({
        where: { id },
      }),
      this.getUserCurrency(userId),
    ]);

    if (!period) {
      throw new NotFoundException('Kỳ ngân sách không tồn tại');
    }
    if (period.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập kỳ ngân sách này');
    }

    const totalLimit = Number(period.total_limit);
    return {
      ...period,
      total_limit: totalLimit,
      formatted_total_limit: formatCurrency(totalLimit, currency),
      start_date: period.start_date.toISOString().split('T')[0],
      end_date: period.end_date.toISOString().split('T')[0],
      created_at: period.created_at.toISOString(),
    };
  }

  async create(userId: string, dto: CreateBudgetPeriodDto) {
    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);

    if (startDate >= endDate) {
      throw new BadRequestException('start_date phải trước end_date');
    }

    const currency = await this.getUserCurrency(userId);

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

    const totalLimit = Number(period.total_limit);
    return {
      ...period,
      total_limit: totalLimit,
      formatted_total_limit: formatCurrency(totalLimit, currency),
      start_date: period.start_date.toISOString().split('T')[0],
      end_date: period.end_date.toISOString().split('T')[0],
      created_at: period.created_at.toISOString(),
    };
  }

  async update(userId: string, id: string, dto: UpdateBudgetPeriodDto) {
    const existing = await this.prisma.budgetPeriod.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Kỳ ngân sách không tồn tại');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa kỳ ngân sách này');
    }

    const startDate = dto.start_date ? new Date(dto.start_date) : existing.start_date;
    const endDate = dto.end_date ? new Date(dto.end_date) : existing.end_date;

    if (startDate >= endDate) {
      throw new BadRequestException('start_date phải trước end_date');
    }

    const currency = await this.getUserCurrency(userId);

    const updated = await this.prisma.budgetPeriod.update({
      where: { id },
      data: {
        ...(dto.total_limit !== undefined && { total_limit: dto.total_limit }),
        ...(dto.start_date && { start_date: startDate }),
        ...(dto.end_date && { end_date: endDate }),
      },
    });

    const totalLimit = Number(updated.total_limit);
    return {
      ...updated,
      total_limit: totalLimit,
      formatted_total_limit: formatCurrency(totalLimit, currency),
      start_date: updated.start_date.toISOString().split('T')[0],
      end_date: updated.end_date.toISOString().split('T')[0],
      created_at: updated.created_at.toISOString(),
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

    const currency = await this.getUserCurrency(userId);
    const updated = await this.prisma.budgetPeriod.update({
      where: { id },
      data: { status: 'closed' },
    });

    const totalLimit = Number(updated.total_limit);
    return {
      ...updated,
      total_limit: totalLimit,
      formatted_total_limit: formatCurrency(totalLimit, currency),
      start_date: updated.start_date.toISOString().split('T')[0],
      end_date: updated.end_date.toISOString().split('T')[0],
      created_at: updated.created_at.toISOString(),
    };
  }

  async remove(userId: string, id: string) {
    const period = await this.prisma.budgetPeriod.findUnique({
      where: { id },
    });

    if (!period) {
      throw new NotFoundException('Kỳ ngân sách không tồn tại');
    }
    if (period.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xoá kỳ ngân sách này');
    }

    await this.prisma.budgetPeriod.delete({
      where: { id },
    });
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

    const [budgets, currency] = await Promise.all([
      this.prisma.budget.findMany({
        where: { budget_period_id: periodId },
        include: { category: true },
      }),
      this.getUserCurrency(userId),
    ]);

    return budgets.map((b) => {
      const limit = Number(b.limit_amount);
      const spent = Number(b.spent_amount);
      const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      const remaining = limit - spent;
      return {
        id: b.id,
        budget_period_id: b.budget_period_id,
        category_id: b.category_id,
        limit_amount: limit,
        spent_amount: spent,
        percent_used: percent,
        remaining_amount: remaining,
        formatted_limit: formatCurrency(limit, currency),
        formatted_spent: formatCurrency(spent, currency),
        formatted_remaining: formatCurrency(remaining, currency),
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

    const currency = await this.getUserCurrency(userId);
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
      const catRemaining = limit - spent;
      return {
        category_id: b.category_id,
        category_name: b.category?.name,
        category_icon: b.category?.icon || undefined,
        limit_amount: limit,
        spent_amount: spent,
        percent_used: percent,
        remaining_amount: catRemaining,
        formatted_limit: formatCurrency(limit, currency),
        formatted_spent: formatCurrency(spent, currency),
        formatted_remaining: formatCurrency(catRemaining, currency),
      };
    });

    return {
      budget_period: {
        ...period,
        total_limit: totalLimit,
        formatted_total_limit: formatCurrency(totalLimit, currency),
        start_date: period.start_date.toISOString().split('T')[0],
        end_date: period.end_date.toISOString().split('T')[0],
        created_at: period.created_at.toISOString(),
      },
      total_limit: totalLimit,
      total_spent: totalSpent,
      remaining,
      percent_used: percentUsed,
      formatted_total_limit: formatCurrency(totalLimit, currency),
      formatted_total_spent: formatCurrency(totalSpent, currency),
      formatted_remaining: formatCurrency(remaining, currency),
      by_category: byCategory,
    };
  }
}
