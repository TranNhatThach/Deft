import { Decimal } from '@prisma/client/runtime/library';

/**
 * Tiện ích định dạng tiền tệ và số liệu tài chính ở tầng dữ liệu (Data Layer)
 */

export function toNumber(value: number | Decimal | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return Number(value);
}

export function formatCurrency(
  value: number | Decimal | string | null | undefined,
  currency = 'VND',
): string {
  const num = toNumber(value);
  const normalizedCurrency = (currency || 'VND').toUpperCase();

  if (normalizedCurrency === 'VND' || normalizedCurrency === 'VNĐ') {
    // Định dạng kiểu Việt Nam: 15.000.000 ₫
    const formatted = Math.round(num).toLocaleString('vi-VN');
    return `${formatted} ₫`;
  }

  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: normalizedCurrency,
    }).format(num);
  } catch {
    return `${num.toLocaleString('vi-VN')} ${currency}`;
  }
}

export function formatNumber(
  value: number | Decimal | string | null | undefined,
): string {
  const num = toNumber(value);
  return num.toLocaleString('vi-VN');
}

export function formatSignedCurrency(
  value: number | Decimal | string | null | undefined,
  type: 'expense' | 'income' | string,
  currency = 'VND',
): string {
  const num = Math.abs(toNumber(value));
  const base = formatCurrency(num, currency);
  if (type === 'income') {
    return `+${base}`;
  }
  return `-${base}`;
}
