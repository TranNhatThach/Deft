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
import { formatCurrency, formatSignedCurrency } from '../common/utils/currency.util';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  private async getUserCurrency(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true },
    });
    return user?.currency || 'VND';
  }

  async findAll(userId: string, query: QueryTransactionsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { user_id: userId };

    if (query.type) {
      where.type = query.type;
    }

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

    const [transactions, total, currency] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { transaction_date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
      this.getUserCurrency(userId),
    ]);

    const formatted = transactions.map((t) => {
      const numAmount = Number(t.amount);
      return {
        ...t,
        amount: numAmount,
        formatted_amount: formatSignedCurrency(numAmount, t.type, currency),
        currency,
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
      };
    });

    return {
      data: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, id: string) {
    const [transaction, currency] = await Promise.all([
      this.prisma.transaction.findUnique({
        where: { id },
        include: { category: true, budget_period: true },
      }),
      this.getUserCurrency(userId),
    ]);

    if (!transaction) {
      throw new NotFoundException('Giao dịch không tồn tại');
    }
    if (transaction.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem giao dịch này');
    }

    const numAmount = Number(transaction.amount);
    return {
      ...transaction,
      amount: numAmount,
      formatted_amount: formatSignedCurrency(numAmount, transaction.type, currency),
      currency,
      transaction_date: transaction.transaction_date.toISOString(),
      created_at: transaction.created_at.toISOString(),
      updated_at: transaction.updated_at.toISOString(),
      category: transaction.category
        ? {
            ...transaction.category,
            created_at: transaction.category.created_at ? transaction.category.created_at.toISOString() : new Date().toISOString(),
            updated_at: transaction.category.updated_at ? transaction.category.updated_at.toISOString() : new Date().toISOString(),
          }
        : undefined,
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

    if (dto.type === 'expense' && !activePeriod) {
      throw new BadRequestException('Không có kỳ ngân sách phù hợp cho ngày giao dịch này');
    }

    // Verify category ownership
    const category = await this.prisma.category.findUnique({
      where: { id: dto.category_id },
    });
    if (!category || category.user_id !== userId) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    const currency = await this.getUserCurrency(userId);

    // 2. Insert transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        user_id: userId,
        category_id: dto.category_id,
        budget_period_id: activePeriod?.id || null,
        amount: dto.amount,
        type: dto.type,
        note: dto.note || null,
        transaction_date: txDate,
      },
      include: { category: true },
    });

    // 3 & 4. Recalculate spent_amount and check thresholds if expense
    if (dto.type === 'expense' && activePeriod) {
      await this.recalculateSpentAndAlert(userId, activePeriod.id, dto.category_id, txDate, currency);
    }

    const numAmount = Number(transaction.amount);
    return {
      ...transaction,
      amount: numAmount,
      formatted_amount: formatSignedCurrency(numAmount, transaction.type, currency),
      currency,
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

    if (dto.category_id) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.category_id },
      });
      if (!category || category.user_id !== userId) {
        throw new NotFoundException('Danh mục không tồn tại');
      }
    }

    const txDate = dto.transaction_date ? new Date(dto.transaction_date) : existing.transaction_date;
    const currency = await this.getUserCurrency(userId);

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

    // If transaction had a period or affects expense budgets, recalculate
    if (existing.budget_period_id) {
      await this.recalculateSpentAndAlert(userId, existing.budget_period_id, existing.category_id, txDate, currency);
      if (dto.category_id && dto.category_id !== existing.category_id) {
        await this.recalculateSpentAndAlert(userId, existing.budget_period_id, dto.category_id, txDate, currency);
      }
    }

    const numAmount = Number(updated.amount);
    return {
      ...updated,
      amount: numAmount,
      formatted_amount: formatSignedCurrency(numAmount, updated.type, currency),
      currency,
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

    const currency = await this.getUserCurrency(userId);

    await this.prisma.transaction.delete({
      where: { id },
    });

    if (existing.budget_period_id && existing.type === 'expense') {
      await this.recalculateSpentAndAlert(
        userId,
        existing.budget_period_id,
        existing.category_id,
        existing.transaction_date,
        currency,
      );
    }
  }

  private async recalculateSpentAndAlert(
    userId: string,
    periodId: string,
    categoryId: string,
    txDate: Date = new Date(),
    currency = 'VND',
  ) {
    const activePeriod = await this.prisma.budgetPeriod.findUnique({
      where: { id: periodId },
    });
    if (!activePeriod) return;

    const startDate = new Date(activePeriod.start_date);
    const endDate = new Date(activePeriod.end_date);
    const currentDate = new Date(txDate);

    // Tính số ngày đã qua trong kỳ (tối thiểu là 1 ngày để tránh chia cho 0)
    const diffTime = Math.max(0, currentDate.getTime() - startDate.getTime());
    const daysPassed = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

    // Số ngày còn lại trong kỳ
    const remainingDaysInPeriod = Math.max(
      0,
      Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)),
    );

    // ==========================================
    // 1. Cập nhật chi tiêu và kiểm tra ngưỡng cho Danh mục (Category)
    // ==========================================
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
        const catRemaining = Math.max(0, catLimit - newCatSpent);
        const catBurnRate = newCatSpent / daysPassed;
        const catForecastDays = catBurnRate > 0 && catRemaining > 0 ? Math.round(catRemaining / catBurnRate) : 0;

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
              let alertTitle = `Cảnh báo ${t}%: ${catName}`;
              let alertMsg = `Danh mục ${catName} đã đạt ${catPercent.toFixed(0)}% hạn mức cho phép.`;

              if (t === 70) {
                alertTitle = `Cảnh báo 70%: ${catName} đang chi tiêu nhanh`;
                alertMsg = `Danh mục ${catName} đã đạt ${catPercent.toFixed(0)}% hạn mức (${formatCurrency(newCatSpent, currency)} / ${formatCurrency(catLimit, currency)}). Tốc độ chi tiêu: ${formatCurrency(catBurnRate, currency)}/ngày. Dự báo sẽ cạn hạn mức trong ${catForecastDays} ngày tới.`;
              } else if (t === 50) {
                alertTitle = `Cảnh báo 50%: ${catName}`;
                alertMsg = `Danh mục ${catName} đã đạt ${catPercent.toFixed(0)}% hạn mức (${formatCurrency(newCatSpent, currency)} / ${formatCurrency(catLimit, currency)}).`;
              } else if (t === 80) {
                alertTitle = `Cảnh báo nghiêm trọng 80%: ${catName}`;
                alertMsg = `Danh mục ${catName} đã đạt ${catPercent.toFixed(0)}% hạn mức (${formatCurrency(newCatSpent, currency)} / ${formatCurrency(catLimit, currency)}). Còn lại: ${formatCurrency(catRemaining, currency)}.`;
              } else if (t >= 100) {
                alertTitle = `Vượt ngân sách: ${catName}`;
                alertMsg = `Danh mục ${catName} đã vượt hạn mức (${formatCurrency(newCatSpent, currency)} / ${formatCurrency(catLimit, currency)})!`;
              }

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
                    total_spent: newCatSpent,
                    total_limit: catLimit,
                    days_passed: daysPassed,
                    burn_rate_per_day: Math.round(catBurnRate),
                    forecast_days_left: catForecastDays,
                    period_days_left: remainingDaysInPeriod,
                  },
                },
              });
            }
          }
        }
      }
    }

    // ==========================================
    // 2. Cập nhật chi tiêu và kiểm tra ngưỡng cho Tổng kỳ (Period Total)
    // ==========================================
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
      const periodRemaining = Math.max(0, periodLimit - newPeriodSpent);

      // Thuật toán: Tốc độ chi tiêu/ngày = Tổng chi / Số ngày đã qua
      const burnRatePerDay = newPeriodSpent / daysPassed;

      // Dự báo số ngày cạn tiền = Số tiền còn lại / Tốc độ chi mỗi ngày
      const forecastDaysLeft = burnRatePerDay > 0 && periodRemaining > 0
        ? Math.round(periodRemaining / burnRatePerDay)
        : 0;

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

            let alertTitle = `Cảnh báo tổng kỳ ${t}%`;
            let alertMsg = `Tổng chi tiêu đã đạt ${periodPercent.toFixed(0)}% tổng hạn mức kỳ.`;

            if (t === 70) {
              alertTitle = `Cảnh báo 70% ngân sách: Đang chi tiêu nhanh`;
              alertMsg = `Tổng chi tiêu đã đạt ${periodPercent.toFixed(0)}% ngân sách (${formatCurrency(newPeriodSpent, currency)} / ${formatCurrency(periodLimit, currency)}). Tốc độ chi tiêu trung bình: ${formatCurrency(burnRatePerDay, currency)}/ngày. Dự báo ngân sách sẽ cạn tiền trong khoảng ${forecastDaysLeft} ngày tới (kỳ còn ${remainingDaysInPeriod} ngày).`;
            } else if (t === 50) {
              alertTitle = `Cảnh báo 50% ngân sách`;
              alertMsg = `Tổng chi tiêu đã đạt ${periodPercent.toFixed(0)}% ngân sách (${formatCurrency(newPeriodSpent, currency)} / ${formatCurrency(periodLimit, currency)}). Tốc độ chi tiêu: ${formatCurrency(burnRatePerDay, currency)}/ngày. Hãy chú ý duy trì tốc độ chi tiêu hợp lý.`;
            } else if (t === 80) {
              alertTitle = `Cảnh báo nghiêm trọng: Đạt 80% ngân sách`;
              alertMsg = `Tổng chi tiêu đã đạt ${periodPercent.toFixed(0)}% ngân sách (${formatCurrency(newPeriodSpent, currency)} / ${formatCurrency(periodLimit, currency)}). Bạn chỉ còn lại ${formatCurrency(periodRemaining, currency)} cho ${remainingDaysInPeriod} ngày còn lại của kỳ.`;
            } else if (t >= 100) {
              alertTitle = `Vượt ngân sách tổng kỳ`;
              alertMsg = `Tổng chi tiêu (${formatCurrency(newPeriodSpent, currency)}) đã vượt toàn bộ hạn mức kỳ (${formatCurrency(periodLimit, currency)})!`;
            }

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
                  total_spent: newPeriodSpent,
                  total_limit: periodLimit,
                  remaining: periodRemaining,
                  days_passed: daysPassed,
                  burn_rate_per_day: Math.round(burnRatePerDay),
                  forecast_days_left: forecastDaysLeft,
                  period_days_left: remainingDaysInPeriod,
                },
              },
            });
          }
        }
      }
    }
  }
}
