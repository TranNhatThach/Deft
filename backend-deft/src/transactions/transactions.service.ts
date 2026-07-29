import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, query: QueryTransactionsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { user_id: userId };

    if (query.category_id) {
      where.category_id = query.category_id;
    }

    if (query.from || query.to) {
      where.transaction_date = {};
      if (query.from) {
        where.transaction_date.gte = new Date(query.from);
      }
      if (query.to) {
        where.transaction_date.lte = new Date(query.to);
      }
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { transaction_date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const formatted = transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      transaction_date: t.transaction_date.toISOString(),
      created_at: t.created_at.toISOString(),
      updated_at: t.updated_at.toISOString(),
      category: t.category
        ? {
            ...t.category,
            created_at: t.category.created_at.toISOString(),
            updated_at: t.category.updated_at.toISOString(),
          }
        : undefined,
    }));

    return {
      data: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(userId: string, dto: CreateTransactionDto) {
    const txDate = new Date(dto.transaction_date);

    // 1. Check open budget period covering transaction_date
    const activePeriod = await this.prisma.budgetPeriod.findFirst({
      where: {
        user_id: userId,
        status: 'open',
        start_date: { lte: txDate },
        end_date: { gte: txDate },
      },
    });

    if (!activePeriod) {
      throw new BadRequestException('Không có kỳ ngân sách phù hợp cho ngày giao dịch này');
    }

    // Verify category ownership
    const category = await this.prisma.category.findUnique({
      where: { id: dto.category_id },
    });
    if (!category || category.user_id !== userId) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    // 2. Insert transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        user_id: userId,
        category_id: dto.category_id,
        budget_period_id: activePeriod.id,
        amount: dto.amount,
        type: dto.type,
        note: dto.note || null,
        transaction_date: txDate,
      },
      include: { category: true },
    });

    // 3 & 4. Recalculate spent_amount and check thresholds if expense
    if (dto.type === 'expense') {
      await this.recalculateSpentAndAlert(userId, activePeriod.id, dto.category_id);
    }

    return {
      ...transaction,
      amount: Number(transaction.amount),
      transaction_date: transaction.transaction_date.toISOString(),
      created_at: transaction.created_at.toISOString(),
      updated_at: transaction.updated_at.toISOString(),
      category: transaction.category
        ? {
            ...transaction.category,
            created_at: transaction.category.created_at.toISOString(),
            updated_at: transaction.category.updated_at.toISOString(),
          }
        : undefined,
    };
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const existing = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Giao dịch không tồn tại');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa giao dịch này');
    }

    const txDate = dto.transaction_date ? new Date(dto.transaction_date) : existing.transaction_date;

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        ...(dto.category_id && { category_id: dto.category_id }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.type && { type: dto.type }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.transaction_date && { transaction_date: txDate }),
      },
      include: { category: true },
    });

    if (existing.budget_period_id) {
      await this.recalculateSpentAndAlert(userId, existing.budget_period_id, existing.category_id);
      if (dto.category_id && dto.category_id !== existing.category_id) {
        await this.recalculateSpentAndAlert(userId, existing.budget_period_id, dto.category_id);
      }
    }

    return {
      ...updated,
      amount: Number(updated.amount),
      transaction_date: updated.transaction_date.toISOString(),
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
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
    const existing = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Giao dịch không tồn tại');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xoá giao dịch này');
    }

    await this.prisma.transaction.delete({
      where: { id },
    });

    if (existing.budget_period_id && existing.type === 'expense') {
      await this.recalculateSpentAndAlert(userId, existing.budget_period_id, existing.category_id);
    }
  }

  private async recalculateSpentAndAlert(
    userId: string,
    periodId: string,
    categoryId: string,
  ) {
    const activePeriod = await this.prisma.budgetPeriod.findUnique({
      where: { id: periodId },
    });
    if (!activePeriod) return;

    // Recalculate spent for this category
    const catSpentSum = await this.prisma.transaction.aggregate({
      where: {
        budget_period_id: periodId,
        category_id: categoryId,
        type: 'expense',
      },
      _sum: { amount: true },
    });
    const newCatSpent = Number(catSpentSum._sum.amount || 0);

    const budget = await this.prisma.budget.findUnique({
      where: {
        budget_period_id_category_id: {
          budget_period_id: periodId,
          category_id: categoryId,
        },
      },
      include: { category: true },
    });

    if (budget) {
      await this.prisma.budget.update({
        where: { id: budget.id },
        data: { spent_amount: newCatSpent },
      });

      const catLimit = Number(budget.limit_amount);
      if (catLimit > 0) {
        const catPercent = (newCatSpent / catLimit) * 100;
        const THRESHOLDS = [50, 70, 80, 100];
        for (const t of THRESHOLDS) {
          if (catPercent >= t) {
            const logged = await this.prisma.alertLog.findUnique({
              where: {
                budget_period_id_category_id_threshold: {
                  budget_period_id: periodId,
                  category_id: categoryId,
                  threshold: t,
                },
              },
            });
            if (!logged) {
              await this.prisma.alertLog.create({
                data: {
                  budget_period_id: periodId,
                  category_id: categoryId,
                  threshold: t,
                },
              });

              const catName = budget.category?.name || 'Danh mục';
              const alertTitle = t >= 100 ? `Vượt ngân sách: ${catName}` : `Cảnh báo ${t}%: ${catName}`;
              const alertMsg = t >= 100
                ? `Danh mục ${catName} đã vượt hạn mức (${catPercent.toFixed(0)}%)!`
                : `Danh mục ${catName} đã đạt ${catPercent.toFixed(0)}% hạn mức cho phép.`;

              await this.prisma.notification.create({
                data: {
                  user_id: userId,
                  type: 'threshold_alert',
                  title: alertTitle,
                  message: alertMsg,
                  metadata: {
                    category_id: categoryId,
                    threshold: t,
                    percent: Math.round(catPercent),
                    budget_period_id: periodId,
                  },
                },
              });
            }
          }
        }
      }
    }

    // Check period total threshold
    const periodSpentSum = await this.prisma.transaction.aggregate({
      where: {
        budget_period_id: periodId,
        type: 'expense',
      },
      _sum: { amount: true },
    });
    const newPeriodSpent = Number(periodSpentSum._sum.amount || 0);
    const periodLimit = Number(activePeriod.total_limit);

    if (periodLimit > 0) {
      const periodPercent = (newPeriodSpent / periodLimit) * 100;
      const THRESHOLDS = [50, 70, 80, 100];
      for (const t of THRESHOLDS) {
        if (periodPercent >= t) {
          const logged = await this.prisma.alertLog.findFirst({
            where: {
              budget_period_id: periodId,
              category_id: null,
              threshold: t,
            },
          });
          if (!logged) {
            await this.prisma.alertLog.create({
              data: {
                budget_period_id: periodId,
                category_id: null,
                threshold: t,
              },
            });

            const alertTitle = t >= 100 ? `Vượt ngân sách tổng kỳ` : `Cảnh báo tổng kỳ ${t}%`;
            const alertMsg = t >= 100
              ? `Tổng chi tiêu đã vượt hạn mức kỳ (${periodPercent.toFixed(0)}%)!`
              : `Tổng chi tiêu đã đạt ${periodPercent.toFixed(0)}% tổng hạn mức kỳ.`;

            await this.prisma.notification.create({
              data: {
                user_id: userId,
                type: 'threshold_alert',
                title: alertTitle,
                message: alertMsg,
                metadata: {
                  threshold: t,
                  percent: Math.round(periodPercent),
                  budget_period_id: periodId,
                },
              },
            });
          }
        }
      }
    }
  }
}
