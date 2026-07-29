/**
 * BudgetScreen — Current period card + category budget limits + create period button.
 * Refactored from 543 → ~150 lines following Karpathy rules.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { COLORS, RADII, formatNumberOnly } from '../constants/theme';
import { USE_MOCK } from '../api/apiClient';
import { MockServer } from '../api/mockServer';

export const BudgetScreen = ({ navigation }: any) => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const totalLimit = 15_000_000;
  const allocated = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
  const remaining = totalLimit - allocated;
  const allocPercent = Math.round((allocated / totalLimit) * 100);

  useEffect(() => {
    const data = USE_MOCK ? MockServer.getBudgetSummary() : [];
    setBudgets(data);
    setLoading(false);
  }, []);

  return (
    <View style={s.container}>
      <Header title="Deft Finance" showBack onBackPress={() => navigation.goBack()} showSearch onSearchPress={() => {}} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>Quản lý kỳ ngân sách</Text>
        <Text style={s.pageSub}>Thiết lập và điều chỉnh hạn mức chi tiêu.</Text>

        {/* Current period card */}
        <PeriodCard totalLimit={totalLimit} allocated={allocated} remaining={remaining} percent={allocPercent} />

        {/* Category list header */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Hạn mức theo danh mục</Text>
          <Text style={s.sectionHint}>Chạm để sửa</Text>
        </View>

        {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} /> : (
          budgets.map(b => (
            <BudgetLimitRow key={b.id} budget={b} totalLimit={totalLimit} onPress={() => navigation.navigate('CategoryManagement')} />
          ))
        )}

        <TouchableOpacity style={s.createBtn} activeOpacity={0.85} onPress={() => navigation.navigate('CategoryManagement')}>
          <Icon name="plus" size={20} color="#FFF" /><Text style={s.createBtnText}>Tạo kỳ ngân sách mới</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ─── Period Card ─────────────────────────────────────────
function PeriodCard({ totalLimit, allocated, remaining, percent }: { totalLimit: number; allocated: number; remaining: number; percent: number }) {
  return (
    <View style={s.periodCard}>
      <View style={s.periodTop}>
        <View>
          <View style={s.dotRow}><View style={s.greenDot} /><Text style={s.periodTag}>KỲ HIỆN TẠI</Text></View>
          <Text style={s.periodDate}>01/07 - 31/07</Text>
        </View>
        <Badge type="active" label="Đang chạy" />
      </View>

      <Text style={s.limitLabel}>Tổng hạn mức</Text>
      <Text style={s.limitAmount}>{formatNumberOnly(totalLimit)} <Text style={s.unit}>đ</Text></Text>
      <View style={{ marginBottom: 12 }}><ProgressBar percent={percent} height={6} /></View>
      <View style={s.allocRow}>
        <Text style={s.allocText}>Đã phân bổ: {formatNumberOnly(allocated)} đ</Text>
        <Text style={s.allocText}>Còn lại: {formatNumberOnly(remaining)} đ</Text>
      </View>

      <TouchableOpacity style={s.closeBtn}>
        <Icon name="lock" size={16} color={COLORS.text} /><Text style={s.closeBtnText}>Đóng kỳ</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Budget Limit Row ────────────────────────────────────
function BudgetLimitRow({ budget, totalLimit, onPress }: { budget: any; totalLimit: number; onPress: () => void }) {
  const pct = Math.round((budget.amount / totalLimit) * 100);
  return (
    <TouchableOpacity activeOpacity={0.8} style={s.catRow} onPress={onPress}>
      <View style={s.catLeft}>
        <View style={s.catIconCircle}><Icon name={budget.categoryIcon || 'tag'} size={20} color={COLORS.primary} /></View>
        <View><Text style={s.catName}>{budget.categoryName}</Text><Text style={s.catRatio}>Chiếm {pct}%</Text></View>
      </View>
      <Text style={s.catAmount}>{formatNumberOnly(budget.amount)} <Text style={s.smallUnit}>đ</Text></Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  pageSub: { fontSize: 13, color: COLORS.muted, marginBottom: 16 },
  periodCard: { backgroundColor: COLORS.card, borderRadius: RADII.card, padding: 20, marginBottom: 24, shadowColor: '#1E2233', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 3 },
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
  closeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADII.button, paddingVertical: 10, gap: 8 },
  closeBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  sectionHint: { fontSize: 12, color: COLORS.muted },
  catRow: { backgroundColor: COLORS.card, borderRadius: RADII.card, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, shadowColor: '#1E2233', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  catLeft: { flexDirection: 'row', alignItems: 'center' },
  catIconCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF5EB', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  catName: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  catRatio: { fontSize: 12, color: COLORS.muted },
  catAmount: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  smallUnit: { fontSize: 12, fontWeight: '400' },
  createBtn: { backgroundColor: COLORS.primary, borderRadius: RADII.button, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  createBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
