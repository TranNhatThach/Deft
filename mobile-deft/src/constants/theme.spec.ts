import { getBudgetColor, formatCurrency, formatNumberOnly, COLORS } from './theme';

export function runThemeUnitTests(): { passed: number; total: number } {
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      passed++;
    } else {
      console.error(`FAIL: ${message}`);
    }
  }

  // 1. getBudgetColor tests
  assert(getBudgetColor(30) === COLORS.safe, 'getBudgetColor(30) should be safe green');
  assert(getBudgetColor(50) === COLORS.attention, 'getBudgetColor(50) should be attention yellow');
  assert(getBudgetColor(75) === COLORS.warning, 'getBudgetColor(75) should be warning orange');
  assert(getBudgetColor(85) === COLORS.critical, 'getBudgetColor(85) should be critical red-orange');
  assert(getBudgetColor(100) === COLORS.overBudget, 'getBudgetColor(100) should be overBudget red');

  // 2. formatCurrency tests
  assert(formatCurrency(150000).includes('150.000'), 'formatCurrency(150000) formats correctly');
  assert(formatCurrency(-50000).includes('-50.000'), 'formatCurrency(-50000) formats negative correctly');

  // 3. formatNumberOnly tests
  assert(formatNumberOnly(1000000) === '1.000.000', 'formatNumberOnly(1000000) formats thousand separators');

  return { passed, total };
}
