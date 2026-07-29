/**
 * Deft Finance — Design Tokens & Helpers
 * Single source of truth for colors, radii, spacing, and formatters.
 */

// ─── Colors ──────────────────────────────────────────────
export const COLORS = {
  primary: '#5B7FFF',
  primaryPressed: '#3E5FE0',
  background: '#F4F6FB',
  card: '#FFFFFF',
  text: '#1E2233',
  muted: '#7A8199',
  border: '#E7EAF3',

  // Budget spectrum
  safe: '#2FBF71',
  attention: '#FFC24B',
  warning: '#FF9F40',
  critical: '#FF6B4A',
  overBudget: '#FF4D5E',

  // Surface helpers
  inputBg: '#FAFBFE',
  secondaryBg: '#F3F5FA',
  expenseBg: '#FFEFEF',
  expenseText: '#FF4D5E',
  incomeBg: '#EAFBEE',
  incomeText: '#2FBF71',
} as const;

// ─── Radii ───────────────────────────────────────────────
export const RADII = {
  card: 18,
  button: 12,
  input: 12,
  pill: 9999,
} as const;

// ─── Spacing ─────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// ─── Budget color by percentage ──────────────────────────
export function getBudgetColor(percent: number): string {
  if (percent >= 100) return COLORS.overBudget;
  if (percent >= 80) return COLORS.critical;
  if (percent >= 70) return COLORS.warning;
  if (percent >= 50) return COLORS.attention;
  return COLORS.safe;
}

// ─── Formatters ──────────────────────────────────────────
export function formatCurrency(amount: number, currency = 'VND'): string {
  const formatted = Math.abs(amount).toLocaleString('vi-VN');
  const unit = currency === 'VND' || currency === 'VNĐ' ? 'đ' : currency;
  if (amount < 0) return `-${formatted} ${unit}`;
  return `${formatted} ${unit}`;
}

export function formatNumberOnly(amount: number): string {
  return amount.toLocaleString('vi-VN');
}
