/**
 * Deft Shared Types & API Contract Definitions
 * Shared between backend (NestJS) and mobile frontend (Expo React Native)
 */

// ==========================================
// 1. Core Domain Entities
// ==========================================

export interface User {
  id: string;
  email: string;
  display_name: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at?: string | null;
}

export type CategoryType = 'expense' | 'income';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon?: string | null;
  type: CategoryType;
  created_at: string;
  updated_at: string;
}

export type BudgetPeriodStatus = 'open' | 'closed';

export interface BudgetPeriod {
  id: string;
  user_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  status: BudgetPeriodStatus;
  total_limit: number;
  formatted_total_limit?: string;
  created_at: string;
}

export interface Budget {
  id: string;
  budget_period_id: string;
  category_id: string;
  limit_amount: number;
  spent_amount: number;
  formatted_limit?: string;
  formatted_spent?: string;
  formatted_remaining?: string;
  // Computed field for UI
  category?: Category;
  percent_used?: number;
  remaining_amount?: number;
}

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  budget_period_id?: string | null;
  amount: number;
  formatted_amount?: string;
  currency?: string;
  type: TransactionType;
  note?: string | null;
  transaction_date: string; // ISO String or YYYY-MM-DD
  created_at: string;
  updated_at: string;
  // Computed field for UI
  category?: Category;
}

export type NotificationType = 'threshold_alert' | 'period_reminder';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  metadata?: {
    category_id?: string;
    threshold?: number;
    percent?: number;
    budget_period_id?: string;
    total_spent?: number;
    total_limit?: number;
    days_passed?: number;
    burn_rate_per_day?: number;
    forecast_days_left?: number;
    period_days_left?: number;
    [key: string]: any;
  } | null;
  created_at: string;
}

export interface AlertLog {
  id: string;
  budget_period_id: string;
  category_id?: string | null;
  threshold: number;
}

// ==========================================
// 2. Request & Response DTO Interfaces
// ==========================================

// Auth
export interface RegisterDto {
  email: string;
  password: string;
  display_name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refresh_token: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

// Users
export interface UpdateUserDto {
  display_name?: string;
  currency?: string;
}

// Categories
export interface CreateCategoryDto {
  name: string;
  type: CategoryType;
  icon?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  icon?: string;
}

// Budget Periods
export interface CreateBudgetPeriodDto {
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  total_limit: number;
}

export interface UpdateBudgetPeriodDto {
  total_limit?: number;
  start_date?: string;
  end_date?: string;
}

// Budgets
export interface UpsertBudgetDto {
  category_id: string;
  limit_amount: number;
}

export interface CreateBudgetDto {
  budget_period_id: string;
  category_id: string;
  limit_amount: number;
}

export interface UpdateBudgetDto {
  limit_amount: number;
}

export interface CategoryBudgetSummary {
  category_id: string;
  category_name?: string;
  category_icon?: string;
  limit_amount: number;
  spent_amount: number;
  percent_used: number;
  formatted_limit?: string;
  formatted_spent?: string;
  remaining_amount?: number;
  formatted_remaining?: string;
}

export interface BudgetPeriodSummaryResponse {
  budget_period: BudgetPeriod;
  total_limit: number;
  total_spent: number;
  remaining: number;
  percent_used: number;
  formatted_total_limit?: string;
  formatted_total_spent?: string;
  formatted_remaining?: string;
  by_category: CategoryBudgetSummary[];
}

// Transactions
export interface CreateTransactionDto {
  category_id: string;
  amount: number;
  type: TransactionType;
  note?: string;
  transaction_date: string; // YYYY-MM-DD or ISO string
}

export interface UpdateTransactionDto {
  category_id?: string;
  amount?: number;
  type?: TransactionType;
  note?: string;
  transaction_date?: string;
}

export interface QueryTransactionsDto {
  category_id?: string;
  type?: TransactionType;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

// Incomes (Dedicated DTOs)
export interface CreateIncomeDto {
  category_id: string;
  amount: number;
  note?: string;
  transaction_date: string;
}

export interface UpdateIncomeDto {
  category_id?: string;
  amount?: number;
  note?: string;
  transaction_date?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Notifications
export interface QueryNotificationsDto {
  is_read?: boolean;
  page?: number;
  limit?: number;
}

// ==========================================
// 3. API Path Constants
// ==========================================

export const API_PATHS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  USERS: {
    ME: '/users/me',
  },
  CATEGORIES: {
    BASE: '/categories',
    BY_ID: (id: string) => `/categories/${id}`,
  },
  BUDGET_PERIODS: {
    BASE: '/budget-periods',
    BY_ID: (id: string) => `/budget-periods/${id}`,
    CURRENT: '/budget-periods/current',
    CLOSE: (id: string) => `/budget-periods/${id}/close`,
    BUDGETS: (id: string) => `/budget-periods/${id}/budgets`,
    SUMMARY: (id: string) => `/budget-periods/${id}/summary`,
  },
  BUDGETS: {
    BASE: '/budgets',
    BY_ID: (id: string) => `/budgets/${id}`,
  },
  TRANSACTIONS: {
    BASE: '/transactions',
    BY_ID: (id: string) => `/transactions/${id}`,
  },
  INCOMES: {
    BASE: '/incomes',
    BY_ID: (id: string) => `/incomes/${id}`,
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    READ: (id: string) => `/notifications/${id}/read`,
    READ_ALL: '/notifications/read-all',
  },
} as const;

// ==========================================
// 4. Threshold & Design Constants
// ==========================================

export const BUDGET_THRESHOLDS = [50, 70, 80, 100] as const;

export type AlertThresholdLevel = 'safe' | 'caution' | 'warning' | 'severe' | 'exceeded';

export interface ThresholdColorConfig {
  label: string;
  hex: string;
  badgeBg: string;
  badgeText: string;
  level: AlertThresholdLevel;
}

export const BUDGET_COLORS: Record<AlertThresholdLevel, ThresholdColorConfig> = {
  safe: {
    label: 'An toàn (<50%)',
    hex: '#2FBF71',
    badgeBg: '#E8F8F0',
    badgeText: '#1E824C',
    level: 'safe',
  },
  caution: {
    label: 'Chú ý (50-69%)',
    hex: '#FFC24B',
    badgeBg: '#FFF8E7',
    badgeText: '#B88200',
    level: 'caution',
  },
  warning: {
    label: 'Cảnh báo (70-79%)',
    hex: '#FF9F40',
    badgeBg: '#FFF3E6',
    badgeText: '#C66900',
    level: 'warning',
  },
  severe: {
    label: 'Nghiêm trọng (80-99%)',
    hex: '#FF6B4A',
    badgeBg: '#FFEBE6',
    badgeText: '#D13814',
    level: 'severe',
  },
  exceeded: {
    label: 'Vượt ngân sách (≥100%)',
    hex: '#FF4D5E',
    badgeBg: '#FFE6E8',
    badgeText: '#D3192B',
    level: 'exceeded',
  },
};

export const getThresholdLevel = (percent: number): AlertThresholdLevel => {
  if (percent >= 100) return 'exceeded';
  if (percent >= 80) return 'severe';
  if (percent >= 70) return 'warning';
  if (percent >= 50) return 'caution';
  return 'safe';
};

export const THEME = {
  colors: {
    primary: '#5B7FFF',
    primaryDark: '#3E5FE0',
    background: '#F4F6FB',
    cardBackground: '#FFFFFF',
    textMain: '#1E2233',
    textMuted: '#7A8199',
    border: '#E7EAF3',
    income: '#2FBF71',
    expense: '#FF4D5E',
  },
  borderRadius: {
    card: 16,
    button: 12,
    input: 10,
    badge: 8,
  },
  typography: {
    heading: 20,
    subheading: 16,
    body: 14,
    caption: 11,
  },
} as const;
