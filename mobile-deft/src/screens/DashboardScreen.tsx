/**
 * DashboardScreen — Summary banner + CategoryCard list + FAB.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Header } from '../components/Header';
import { CategoryCard } from '../components/CategoryCard';
import { ProgressBar } from '../components/ProgressBar';
import { FloatingAddButton } from '../components/FloatingAddButton';
import { COLORS, RADII, formatNumberOnly, formatCurrency } from '../constants/theme';
import { getDashboardSummary } from '../api/services';
import type { DashboardSummary } from '../api/mappers';

export const DashboardScreen = ({ navigation }: any) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSummary(await getDashboardSummary());
    } catch {
      setError('Không tải được dữ liệu ngân sách.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const hasPeriod = !!summary?.periodId;
  const totalBudget = summary?.totalLimit ?? 0;
  const totalSpent = summary?.totalSpent ?? 0;
  const totalRemaining = summary?.totalRemaining ?? 0;
  const spentPercent = summary?.spentPercent ?? 0;
  const budgets = summary?.categories ?? [];

  return (
    <View style={s.container}>
      <Header title="Deft Finance" showBack={false} showSearch onSearchPress={() => {}} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {error ? <Text style={s.errorText}>{error}</Text> : null}

        {!loading && !hasPeriod ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyTitle}>Chưa có kỳ ngân sách</Text>
            <Text style={s.emptySub}>Tạo kỳ ngân sách để theo dõi chi tiêu tháng này.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('BudgetTab')}>
              <Text style={s.emptyBtnText}>Tạo kỳ ngân sách</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.summaryCard}>
            <Text style={s.summaryTitle}>Tổng ngân sách kỳ</Text>
            <Text style={s.summaryAmount}>
              {formatNumberOnly(totalBudget)} <Text style={s.currency}>VNĐ</Text>
            </Text>
            <View style={{ marginBottom: 14 }}>
              <ProgressBar percent={spentPercent} height={8} />
            </View>
            <View style={s.metricsRow}>
              <View>
                <Text style={s.subLabel}>Đã chi</Text>
                <Text style={s.subValue}>{formatCurrency(totalSpent)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' as const }}>
                <Text style={s.subLabel}>Còn lại</Text>
                <Text style={s.subValue}>{formatCurrency(totalRemaining)}</Text>
              </View>
            </View>
          </View>
        )}

        {hasPeriod && (
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Chi tiết danh mục</Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : hasPeriod && budgets.length === 0 ? (
          <Text style={s.emptySub}>Chưa đặt hạn mức danh mục. Vào tab Ngân sách để thiết lập.</Text>
        ) : (
          budgets.map((b) => (
            <CategoryCard
              key={b.id}
              budget={b}
              onPress={() =>
                navigation.navigate('TransactionsTab', {
                  categoryId: b.categoryId,
                  categoryName: b.categoryName,
                })
              }
            />
          ))
        )}
      </ScrollView>

      <FloatingAddButton onPress={() => navigation.navigate('AddEditTransaction')} />
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 90 },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.card,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#1E2233',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  summaryTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  summaryAmount: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  currency: { fontSize: 16, fontWeight: '500', color: COLORS.muted },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 2 },
  subValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.card,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptySub: { fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 18 },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADII.button,
  },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  errorText: { color: COLORS.overBudget, marginBottom: 12, fontSize: 13 },
});
