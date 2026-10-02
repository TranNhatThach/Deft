import {
  API_PATHS,
  Budget,
  BudgetPeriod,
  BudgetPeriodSummaryResponse,
  CreateBudgetPeriodDto,
  UpsertBudgetDto,
} from '../../../../shared/types';
import { apiClient, USE_MOCK } from '../apiClient';
import { MockServer } from '../mockServer';
import {
  DashboardSummary,
  emptyDashboardSummary,
  mapBudgetToBudgetRow,
  mapSummaryResponse,
} from '../mappers';

export async function getCurrentPeriod(): Promise<BudgetPeriod | null> {
  if (USE_MOCK) {
    return {
      id: 'mock-period',
      user_id: 'u-101',
      start_date: '2026-07-01',
      end_date: '2026-07-31',
      status: 'open',
      total_limit: 50_000_000,
      created_at: new Date().toISOString(),
    };
  }
  const res = await apiClient.get<BudgetPeriod | null>(API_PATHS.BUDGET_PERIODS.CURRENT);
  return res.data;
}

export async function getPeriodSummary(periodId: string): Promise<BudgetPeriodSummaryResponse> {
  const res = await apiClient.get<BudgetPeriodSummaryResponse>(
    API_PATHS.BUDGET_PERIODS.SUMMARY(periodId),
  );
  return res.data;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (USE_MOCK) {
    const categories = MockServer.getBudgetSummary();
    const totalSpent = categories.reduce((sum, b) => sum + b.spent, 0);
    const totalLimit = 50_000_000;
    return {
      periodId: 'mock-period',
      totalLimit,
      totalSpent,
      totalRemaining: totalLimit - totalSpent,
      spentPercent: Math.round((totalSpent / totalLimit) * 100),
      categories: categories.map((b) => ({
        id: b.id,
        categoryName: b.categoryName,
        categoryIcon: b.categoryIcon,
        amount: b.amount,
        spent: b.spent,
        percent: b.percent,
      })),
    };
  }

  const current = await getCurrentPeriod();
  if (!current?.id) return emptyDashboardSummary();
  const summary = await getPeriodSummary(current.id);
  return mapSummaryResponse(summary);
}

export async function getPeriodBudgets(periodId: string): Promise<Budget[]> {
  if (USE_MOCK) {
    return MockServer.getBudgetSummary().map((b) => ({
      id: b.id,
      budget_period_id: 'mock-period',
      category_id: b.id,
      limit_amount: b.amount,
      spent_amount: b.spent,
      percent_used: b.percent,
      remaining_amount: b.amount - b.spent,
      category: {
        id: b.id,
        user_id: 'u-101',
        name: b.categoryName,
        icon: b.categoryIcon,
        type: 'expense' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    }));
  }
  const res = await apiClient.get<Budget[]>(API_PATHS.BUDGET_PERIODS.BUDGETS(periodId));
  return res.data;
}

export async function createPeriod(dto: CreateBudgetPeriodDto): Promise<BudgetPeriod> {
  const res = await apiClient.post<BudgetPeriod>(API_PATHS.BUDGET_PERIODS.BASE, dto);
  return res.data;
}

export async function closePeriod(periodId: string): Promise<BudgetPeriod> {
  const res = await apiClient.patch<BudgetPeriod>(API_PATHS.BUDGET_PERIODS.CLOSE(periodId));
  return res.data;
}

export async function updatePeriod(
  periodId: string,
  dto: import('../../../../shared/types').UpdateBudgetPeriodDto,
): Promise<BudgetPeriod> {
  const res = await apiClient.patch<BudgetPeriod>(API_PATHS.BUDGET_PERIODS.BY_ID(periodId), dto);
  return res.data;
}

export async function deletePeriod(periodId: string): Promise<void> {
  await apiClient.delete(API_PATHS.BUDGET_PERIODS.BY_ID(periodId));
}

export async function upsertCategoryBudget(
  periodId: string,
  dto: UpsertBudgetDto,
): Promise<Budget> {
  const res = await apiClient.post<Budget>(API_PATHS.BUDGET_PERIODS.BUDGETS(periodId), dto);
  return res.data;
}

export async function deleteCategoryBudget(budgetId: string): Promise<void> {
  await apiClient.delete(API_PATHS.BUDGETS.BY_ID(budgetId));
}

export async function getBudgetScreenData(): Promise<{
  period: BudgetPeriod | null;
  budgets: ReturnType<typeof mapBudgetToBudgetRow>[];
}> {
  if (USE_MOCK) {
    const period = await getCurrentPeriod();
    const budgets = MockServer.getBudgetSummary().map((b) => ({
      id: b.id,
      categoryName: b.categoryName,
      categoryIcon: b.categoryIcon,
      amount: b.amount,
      spent: b.spent,
      percent: b.percent,
    }));
    return { period, budgets };
  }

  const period = await getCurrentPeriod();
  if (!period?.id) return { period: null, budgets: [] };
  const budgets = (await getPeriodBudgets(period.id)).map(mapBudgetToBudgetRow);
  return { period, budgets };
}
