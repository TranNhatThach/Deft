import {
  Budget,
  BudgetPeriodSummaryResponse,
  Category,
  CategoryBudgetSummary,
  Notification,
  Transaction,
} from '../../../shared/types';

/** Shape expected by CategoryCard on Dashboard */
export interface DashboardCategoryBudget {
  id: string;
  categoryName: string;
  categoryIcon: string;
  amount: number;
  spent: number;
  percent: number;
  categoryId?: string;
}

/** Shape used by TransactionsScreen list rows */
export interface TransactionListItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  amount: number;
  type: 'expense' | 'income';
  note?: string | null;
  date: string;
  transaction_date: string;
}

/** Shape used by NotificationsScreen */
export interface NotificationListItem {
  id: string;
  type: 'over_budget' | 'warning_80' | 'warning_70' | 'warning_50' | 'transaction_alert';
  title: string;
  message: string;
  createdAt: string;
  group: 'today' | 'yesterday' | 'older';
  isRead: boolean;
}

export function mapBudgetToDashboardCard(b: Budget): DashboardCategoryBudget {
  return {
    id: b.id,
    categoryId: b.category_id,
    categoryName: b.category?.name || 'Danh mục',
    categoryIcon: b.category?.icon || 'tag',
    amount: b.limit_amount,
    spent: b.spent_amount,
    percent: b.percent_used ?? 0,
  };
}

export function mapCategorySummaryToDashboardCard(c: CategoryBudgetSummary): DashboardCategoryBudget {
  return {
    id: c.category_id,
    categoryId: c.category_id,
    categoryName: c.category_name || 'Danh mục',
    categoryIcon: c.category_icon || 'tag',
    amount: c.limit_amount,
    spent: c.spent_amount,
    percent: c.percent_used,
  };
}

export function mapBudgetToBudgetRow(b: Budget): DashboardCategoryBudget {
  return mapBudgetToDashboardCard(b);
}

export function mapTransaction(t: Transaction): TransactionListItem {
  const signedAmount = t.type === 'expense' ? -Number(t.amount) : Number(t.amount);
  return {
    id: t.id,
    categoryId: t.category_id,
    categoryName: t.category?.name || 'Danh mục',
    categoryIcon: t.category?.icon || 'tag',
    amount: signedAmount,
    type: t.type,
    note: t.note,
    date: t.transaction_date.split('T')[0],
    transaction_date: t.transaction_date,
  };
}

function notificationDisplayType(n: Notification): NotificationListItem['type'] {
  const threshold = n.metadata?.threshold ?? n.metadata?.percent ?? 0;
  if (threshold >= 100 || (n.metadata?.percent ?? 0) >= 100) return 'over_budget';
  if (threshold >= 80) return 'warning_80';
  if (threshold >= 70) return 'warning_70';
  if (threshold >= 50) return 'warning_50';
  return 'transaction_alert';
}

function notificationDateGroup(isoDate: string): NotificationListItem['group'] {
  const d = new Date(isoDate);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (d >= startOfToday) return 'today';
  if (d >= startOfYesterday) return 'yesterday';
  return 'older';
}

function formatRelativeTime(isoDate: string): string {
  const d = new Date(isoDate);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} giờ trước`;
  return d.toLocaleDateString('vi-VN');
}

export function mapNotification(n: Notification): NotificationListItem {
  return {
    id: n.id,
    type: notificationDisplayType(n),
    title: n.title,
    message: n.message,
    createdAt: formatRelativeTime(n.created_at),
    group: notificationDateGroup(n.created_at),
    isRead: n.is_read,
  };
}

export function formatPeriodDateRange(start: string, end: string): string {
  const fmt = (s: string) => {
    const [y, m, d] = s.split('T')[0].split('-');
    return `${d}/${m}`;
  };
  return `${fmt(start)} - ${fmt(end)}`;
}

export interface DashboardSummary {
  periodId: string | null;
  totalLimit: number;
  totalSpent: number;
  totalRemaining: number;
  spentPercent: number;
  categories: DashboardCategoryBudget[];
}

export function mapSummaryResponse(summary: BudgetPeriodSummaryResponse): DashboardSummary {
  return {
    periodId: summary.budget_period.id,
    totalLimit: summary.total_limit,
    totalSpent: summary.total_spent,
    totalRemaining: summary.remaining,
    spentPercent: summary.percent_used,
    categories: summary.by_category.map(mapCategorySummaryToDashboardCard),
  };
}

export function emptyDashboardSummary(): DashboardSummary {
  return {
    periodId: null,
    totalLimit: 0,
    totalSpent: 0,
    totalRemaining: 0,
    spentPercent: 0,
    categories: [],
  };
}

export function toIsoDate(input: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
    return input.split('T')[0];
  }
  const parts = input.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return new Date().toISOString().split('T')[0];
}

export function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function currentMonthPeriodDates(): { start_date: string; end_date: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  const iso = (d: Date) => d.toISOString().split('T')[0];
  return { start_date: iso(start), end_date: iso(end) };
}
