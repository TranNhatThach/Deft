/**
 * BudgetScreen — Current period card + category budget limits + create period.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { Toast } from '../components/Toast';
import { COLORS, RADII, formatNumberOnly } from '../constants/theme';
import {
  closePeriod,
  createPeriod,
  getBudgetScreenData,
  upsertCategoryBudget,
  deleteCategoryBudget,
} from '../api/services';
import { formatPeriodDateRange, currentMonthPeriodDates } from '../api/mappers';
import type { DashboardCategoryBudget } from '../api/mappers';
import type { BudgetPeriod } from '../../../shared/types';
import { listCategories } from '../api/services/categoryService';

export const BudgetScreen = ({ navigation }: any) => {
  const [period, setPeriod] = useState<BudgetPeriod | null>(null);
  const [budgets, setBudgets] = useState<DashboardCategoryBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createLimit, setCreateLimit] = useState('15000000');
  const [saving, setSaving] = useState(false);
  const [editingBudget, setEditingBudget] = useState<DashboardCategoryBudget | null>(null);
  const [editLimit, setEditLimit] = useState('');

  const showMsg = (msg: string, isError = false) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBudgetScreenData();
      setPeriod(data.period);
      setBudgets(data.budgets);
    } catch {
      showMsg('Không tải được dữ liệu ngân sách.', true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const totalLimit = period ? Number(period.total_limit) : 0;
  const allocated = budgets.reduce((sum, b) => sum + b.amount, 0);
  const remaining = totalLimit - allocated;
  const allocPercent = totalLimit > 0 ? Math.round((allocated / totalLimit) * 100) : 0;

  const handleCreatePeriod = async () => {
    const limit = parseFloat(createLimit.replace(/\./g, ''));
    if (isNaN(limit) || limit <= 0) return showMsg('Nhập tổng hạn mức hợp lệ.', true);

    setSaving(true);
    try {
      const dates = currentMonthPeriodDates();
      await createPeriod({ ...dates, total_limit: limit });
      setShowCreate(false);
      showMsg('Đã tạo kỳ ngân sách mới.');
      await loadData();
    } catch {
      showMsg('Tạo kỳ ngân sách thất bại.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleClosePeriod = () => {
    if (!period?.id) return;
    Alert.alert('Đóng kỳ ngân sách', 'Kỳ hiện tại sẽ được đóng. Bạn có chắc?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đóng kỳ',
        style: 'destructive',
        onPress: async () => {
          try {
            await closePeriod(period.id);
            showMsg('Đã đóng kỳ ngân sách.');
            await loadData();
          } catch {
            showMsg('Đóng kỳ thất bại.', true);
          }
        },
      },
    ]);
  };

  const handleSaveBudgetLimit = async () => {
    if (!period?.id || !editingBudget) return;
    const limit = parseFloat(editLimit.replace(/\./g, ''));
    if (isNaN(limit) || limit < 0) return showMsg('Hạn mức không hợp lệ.', true);

    setSaving(true);
    try {
      await upsertCategoryBudget(period.id, {
        category_id: editingBudget.categoryId || editingBudget.id,
        limit_amount: limit,
      });
      setEditingBudget(null);
      showMsg('Đã cập nhật hạn mức.');
      await loadData();
    } catch {
      showMsg('Cập nhật hạn mức thất bại.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudgetLimit = () => {
    if (!editingBudget) return;
    Alert.alert(
      'Xoá hạn mức',
      `Bạn có chắc chắn muốn xoá hạn mức cho danh mục "${editingBudget.categoryName}"?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              if (editingBudget.id) {
                await deleteCategoryBudget(editingBudget.id);
              }
              setEditingBudget(null);
              showMsg('Đã xoá hạn mức danh mục.');
              await loadData();
            } catch {
              showMsg('Xoá hạn mức thất bại.', true);
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  const handleAddCategoryBudget = async () => {
    if (!period?.id) return showMsg('Tạo kỳ ngân sách trước.', true);
    try {
      const cats = await listCategories();
      const expenseCats = cats.filter((c) => c.type === 'expense');
      const withoutBudget = expenseCats.find(
        (c) => !budgets.some((b) => b.categoryId === c.id || b.id === c.id),
      );
      if (!withoutBudget) {
        showMsg('Tất cả danh mục chi đã có hạn mức.', true);
        return;
      }
      setEditingBudget({
        id: withoutBudget.id,
        categoryId: withoutBudget.id,
        categoryName: withoutBudget.name,
        categoryIcon: withoutBudget.icon || 'tag',
        amount: 0,
        spent: 0,
        percent: 0,
      });
      setEditLimit('');
    } catch {
      showMsg('Không tải được danh mục.', true);
    }
  };

  return (
    <View style={s.container}>
      <Toast message={toast} type="error" visible={!!toast} />
      <Header title="Deft Finance" showBack onBackPress={() => navigation.goBack()} showSearch onSearchPress={() => {}} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>Quản lý kỳ ngân sách</Text>
        <Text style={s.pageSub}>Thiết lập và điều chỉnh hạn mức chi tiêu.</Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : !period ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyTitle}>Chưa có kỳ đang mở</Text>
            <Text style={s.emptySub}>Tạo kỳ ngân sách cho tháng hiện tại để bắt đầu.</Text>
          </View>
        ) : (
          <PeriodCard
            period={period}
            totalLimit={totalLimit}
            allocated={allocated}
            remaining={remaining}
            percent={allocPercent}
            onClose={handleClosePeriod}
          />
        )}

        {period && (
          <>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Hạn mức theo danh mục</Text>
              <Text style={s.sectionHint}>Chạm để sửa</Text>
            </View>

            {budgets.map((b) => (
              <BudgetLimitRow
                key={b.id}
                budget={b}
                totalLimit={totalLimit}
                onPress={() => {
                  setEditingBudget(b);
                  setEditLimit(String(b.amount));
                }}
              />
            ))}

            <TouchableOpacity style={s.secondaryBtn} onPress={handleAddCategoryBudget}>
              <Icon name="plus" size={18} color={COLORS.primary} />
              <Text style={s.secondaryBtnText}>Thêm hạn mức danh mục</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={s.createBtn} activeOpacity={0.85} onPress={() => setShowCreate(true)}>
          <Icon name="plus" size={20} color="#FFF" />
          <Text style={s.createBtnText}>Tạo kỳ ngân sách mới</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Create period modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Tạo kỳ ngân sách mới</Text>
            <Text style={s.modalHint}>Kỳ cũ đang mở sẽ tự động đóng.</Text>
            <Text style={s.fieldLabel}>Tổng hạn mức (VNĐ)</Text>
            <TextInput
              style={s.fieldInput}
              value={createLimit}
              onChangeText={setCreateLimit}
              keyboardType="numeric"
              placeholder="15000000"
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={s.cancelBtnText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} disabled={saving} onPress={handleCreatePeriod}>
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={s.saveBtnText}>Tạo kỳ</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit budget limit modal */}
      <Modal visible={!!editingBudget} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>{editingBudget?.categoryName}</Text>
            <Text style={s.fieldLabel}>Hạn mức (VNĐ)</Text>
            <TextInput
              style={s.fieldInput}
              value={editLimit}
              onChangeText={setEditLimit}
              keyboardType="numeric"
              placeholder="0"
            />
            <View style={s.modalActions}>
              {editingBudget?.amount ? (
                <TouchableOpacity
                  style={s.deleteBtn}
                  disabled={saving}
                  onPress={handleDeleteBudgetLimit}
                >
                  <Text style={s.deleteBtnText}>Xoá</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={s.cancelBtn} onPress={() => setEditingBudget(null)}>
                <Text style={s.cancelBtnText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} disabled={saving} onPress={handleSaveBudgetLimit}>
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={s.saveBtnText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

function PeriodCard({
  period,
  totalLimit,
  allocated,
  remaining,
  percent,
  onClose,
}: {
  period: BudgetPeriod;
  totalLimit: number;
  allocated: number;
  remaining: number;
  percent: number;
  onClose: () => void;
}) {
  return (
    <View style={s.periodCard}>
      <View style={s.periodTop}>
        <View>
          <View style={s.dotRow}>
            <View style={s.greenDot} />
            <Text style={s.periodTag}>KỲ HIỆN TẠI</Text>
          </View>
          <Text style={s.periodDate}>
            {formatPeriodDateRange(period.start_date, period.end_date)}
          </Text>
        </View>
        <Badge type="active" label="Đang chạy" />
      </View>

      <Text style={s.limitLabel}>Tổng hạn mức</Text>
      <Text style={s.limitAmount}>
        {formatNumberOnly(totalLimit)} <Text style={s.unit}>đ</Text>
      </Text>
      <View style={{ marginBottom: 12 }}>
        <ProgressBar percent={percent} height={6} />
      </View>
      <View style={s.allocRow}>
        <Text style={s.allocText}>Đã phân bổ: {formatNumberOnly(allocated)} đ</Text>
        <Text style={s.allocText}>Còn lại: {formatNumberOnly(remaining)} đ</Text>
      </View>

      <TouchableOpacity style={s.closeBtn} onPress={onClose}>
        <Icon name="lock" size={16} color={COLORS.text} />
        <Text style={s.closeBtnText}>Đóng kỳ</Text>
      </TouchableOpacity>
    </View>
  );
}

function BudgetLimitRow({
  budget,
  totalLimit,
  onPress,
}: {
  budget: DashboardCategoryBudget;
  totalLimit: number;
  onPress: () => void;
}) {
  const pct = totalLimit > 0 ? Math.round((budget.amount / totalLimit) * 100) : 0;
  return (
    <TouchableOpacity activeOpacity={0.8} style={s.catRow} onPress={onPress}>
      <View style={s.catLeft}>
        <View style={s.catIconCircle}>
          <Icon name={budget.categoryIcon || 'tag'} size={20} color={COLORS.primary} />
        </View>
        <View>
          <Text style={s.catName}>{budget.categoryName}</Text>
          <Text style={s.catRatio}>
            Đã chi {formatNumberOnly(budget.spent)} / {formatNumberOnly(budget.amount)} đ
          </Text>
        </View>
      </View>
      <Text style={s.catAmount}>
        {formatNumberOnly(budget.amount)} <Text style={s.smallUnit}>đ</Text>
      </Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  pageSub: { fontSize: 13, color: COLORS.muted, marginBottom: 16 },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.card,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.muted, textAlign: 'center' },
  periodCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.card,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#1E2233',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  periodTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  dotRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.safe, marginRight: 6 },
  periodTag: { fontSize: 11, fontWeight: '700', color: COLORS.muted, letterSpacing: 0.5 },
  periodDate: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  limitLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 2 },
  limitAmount: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  unit: { fontSize: 16, fontWeight: '500' },
  allocRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  allocText: { fontSize: 12, color: COLORS.muted, fontWeight: '500' },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.button,
    paddingVertical: 10,
    gap: 8,
  },
  closeBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  sectionHint: { fontSize: 12, color: COLORS.muted },
  catRow: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    elevation: 1,
  },
  catLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  catIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF5EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  catName: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  catRatio: { fontSize: 12, color: COLORS.muted },
  catAmount: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  smallUnit: { fontSize: 12, fontWeight: '400' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 8,
  },
  secondaryBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  createBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADII.button,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    elevation: 4,
  },
  createBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(30,34,51,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  modalHint: { fontSize: 13, color: COLORS.muted, marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.muted, marginBottom: 6 },
  fieldInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#FAFBFE',
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.button,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: { fontWeight: '700', color: COLORS.text },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADII.button,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFF', fontWeight: '700' },
  deleteBtn: {
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FF4D5E',
    backgroundColor: '#FFEFEF',
    borderRadius: RADII.button,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { color: '#FF4D5E', fontWeight: '700' },
});
