/**
 * DashboardScreen — Summary banner + CategoryCard list + FAB.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Header } from '../components/Header';
import { CategoryCard } from '../components/CategoryCard';
import { ProgressBar } from '../components/ProgressBar';
import { FloatingAddButton } from '../components/FloatingAddButton';
import { COLORS, RADII, formatNumberOnly, formatCurrency } from '../constants/theme';
import { apiClient, USE_MOCK } from '../api/apiClient';
import { MockServer } from '../api/mockServer';

export const DashboardScreen = ({ navigation }: any) => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const totalBudget = 50_000_000;
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
  const totalRemaining = totalBudget - totalSpent;
  const spentPercent = Math.round((totalSpent / totalBudget) * 100);

  useEffect(() => {
    (async () => {
      try {
        if (USE_MOCK) {
          setBudgets(MockServer.getBudgetSummary());
        } else {
          const res = await apiClient.get('/api/budget-periods/current');
          if (res.data?.id) {
            const budgetsRes = await apiClient.get(`/api/budget-periods/${res.data.id}/budgets`);
            setBudgets(budgetsRes.data || []);
          }
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <View style={s.container}>
      <Header title="Deft Finance" showBack={false} showSearch onSearchPress={() => {}} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Summary banner */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>Tổng ngân sách tháng</Text>
          <Text style={s.summaryAmount}>{formatNumberOnly(totalBudget)} <Text style={s.currency}>VNĐ</Text></Text>
          <View style={{ marginBottom: 14 }}><ProgressBar percent={spentPercent} height={8} /></View>
          <View style={s.metricsRow}>
            <View><Text style={s.subLabel}>Đã chi</Text><Text style={s.subValue}>{formatCurrency(totalSpent)}</Text></View>
            <View style={{ alignItems: 'flex-end' as const }}><Text style={s.subLabel}>Còn lại</Text><Text style={s.subValue}>{formatCurrency(totalRemaining)}</Text></View>
          </View>
        </View>

        {/* Category list */}
        <View style={s.sectionHeader}><Text style={s.sectionTitle}>Chi tiết danh mục</Text></View>

        {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} /> : (
          budgets.map(b => (
            <CategoryCard key={b.id} budget={b} onPress={() => navigation.navigate('CategoryManagement')} />
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
  summaryCard: { backgroundColor: COLORS.card, borderRadius: RADII.card, padding: 20, marginBottom: 20, shadowColor: '#1E2233', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 3 },
  summaryTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  summaryAmount: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  currency: { fontSize: 16, fontWeight: '500', color: COLORS.muted },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 2 },
  subValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
});
