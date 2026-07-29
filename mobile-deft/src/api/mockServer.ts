/**
 * MockServer — In-memory mock data for offline preview.
 * All methods are synchronous — returns static data, no AsyncStorage complexity.
 */

// ─── Categories ──────────────────────────────────────────
const CATEGORIES = [
  { id: 'cat_1', name: 'Ăn uống', icon: 'utensils', type: 'expense', isCustom: false, transactionCount: 24 },
  { id: 'cat_2', name: 'Đi lại', icon: 'car', type: 'expense', isCustom: false, transactionCount: 12 },
  { id: 'cat_3', name: 'Mua sắm', icon: 'shoppingBag', type: 'expense', isCustom: false, transactionCount: 8 },
  { id: 'cat_4', name: 'Nhà cửa', icon: 'home', type: 'expense', isCustom: false, transactionCount: 3 },
  { id: 'cat_5', name: 'Giải trí', icon: 'film', type: 'expense', isCustom: false, transactionCount: 6 },
  { id: 'cat_6', name: 'Lương', icon: 'wallet', type: 'income', isCustom: false, transactionCount: 1 },
  { id: 'cat_7', name: 'Thưởng', icon: 'gift', type: 'income', isCustom: false, transactionCount: 2 },
];

// ─── Budget Summary ──────────────────────────────────────
const BUDGET_SUMMARY = [
  { id: 'b_1', categoryName: 'Ăn uống', categoryIcon: 'utensils', amount: 5_000_000, spent: 4_250_000, percent: 85 },
  { id: 'b_2', categoryName: 'Đi lại', categoryIcon: 'car', amount: 3_000_000, spent: 1_920_000, percent: 64 },
  { id: 'b_3', categoryName: 'Mua sắm', categoryIcon: 'shoppingBag', amount: 4_000_000, spent: 4_500_000, percent: 113 },
  { id: 'b_4', categoryName: 'Nhà cửa', categoryIcon: 'home', amount: 2_000_000, spent: 2_000_000, percent: 100 },
];

// ─── Transactions ────────────────────────────────────────
const TRANSACTIONS = [
  { id: 'tx_1', categoryId: 'cat_1', categoryName: 'Ăn uống', categoryIcon: 'utensils', amount: -350000, type: 'expense', note: 'Cơm trưa văn phòng', date: '2026-07-29', paymentMethod: 'cash' },
  { id: 'tx_2', categoryId: 'cat_2', categoryName: 'Đi lại', categoryIcon: 'car', amount: -120000, type: 'expense', note: 'Grab đi làm', date: '2026-07-29', paymentMethod: 'e-wallet' },
  { id: 'tx_3', categoryId: 'cat_3', categoryName: 'Mua sắm', categoryIcon: 'shoppingBag', amount: -890000, type: 'expense', note: 'Quần áo Uniqlo', date: '2026-07-29', paymentMethod: 'credit' },
  { id: 'tx_4', categoryId: 'cat_1', categoryName: 'Ăn uống', categoryIcon: 'utensils', amount: -450000, type: 'expense', note: 'Ăn tối nhà hàng', date: '2026-07-28', paymentMethod: 'bank_transfer' },
  { id: 'tx_5', categoryId: 'cat_6', categoryName: 'Lương', categoryIcon: 'wallet', amount: 25_000_000, type: 'income', note: 'Lương tháng 7', date: '2026-07-28', paymentMethod: 'bank_transfer' },
];

// ─── Notifications ───────────────────────────────────────
const NOTIFICATIONS = [
  { id: 'n_1', type: 'over_budget', title: 'Vượt ngân sách: Mua sắm', message: 'Danh mục Mua sắm đã vượt 113% hạn mức. Hãy xem xét điều chỉnh chi tiêu.', createdAt: 'Vừa xong', group: 'today', isRead: false },
  { id: 'n_2', type: 'warning_80', title: 'Cảnh báo 80%: Ăn uống', message: 'Danh mục Ăn uống đã đạt 85% hạn mức cho phép.', createdAt: '2 giờ trước', group: 'today', isRead: false },
  { id: 'n_3', type: 'warning_50', title: 'Đạt 50%: Đi lại', message: 'Đi lại đã sử dụng 64% hạn mức tháng này.', createdAt: 'HÔM QUA', group: 'yesterday', isRead: true },
  { id: 'n_4', type: 'transaction_alert', title: 'Giao dịch lớn', message: 'Lương tháng 7 +25.000.000 đ đã được ghi nhận.', createdAt: 'HÔM QUA', group: 'yesterday', isRead: true },
];

// ─── Exports ─────────────────────────────────────────────
export class MockServer {
  static getCategories() { return [...CATEGORIES]; }
  static getBudgetSummary() { return [...BUDGET_SUMMARY]; }
  static getTransactions() { return [...TRANSACTIONS]; }
  static getNotifications() { return [...NOTIFICATIONS]; }

  static async login(email: string) {
    return {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      user: {
        id: 'u-101',
        email,
        display_name: 'Minh Tuấn',
        currency: 'VNĐ',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  static async register(name: string, email: string) {
    return this.login(email);
  }
}
