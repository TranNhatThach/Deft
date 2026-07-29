/**
 * TransactionsScreen — Filter chips, grouped transaction list, FAB.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { FloatingAddButton } from '../components/FloatingAddButton';
import { COLORS, RADII, formatCurrency } from '../constants/theme';
import { apiClient, USE_MOCK } from '../api/apiClient';
import { MockServer } from '../api/mockServer';

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Tiền mặt', credit: 'Thẻ tín dụng', 'e-wallet': 'Ví điện tử',
  bank_transfer: 'Chuyển khoản', auto: 'Tự động',
};
const CATEGORY_FILTERS = ['Tất cả', 'Ăn uống', 'Đi lại', 'Mua sắm', 'Nhà cửa'];

export const TransactionsScreen = ({ navigation }: any) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('Tất cả');

  useEffect(() => {
    (async () => {
      try {
        const data = USE_MOCK ? MockServer.getTransactions() : (await apiClient.get('/api/transactions')).data;
        setTransactions(data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = selectedCat === 'Tất cả' ? transactions : transactions.filter(t => t.categoryName === selectedCat);
  const todayTx = filtered.slice(0, 3);
  const yesterdayTx = filtered.slice(3);

  return (
    <View style={s.container}>
      <Header title="Giao dịch" showBack onBackPress={() => navigation.goBack()} showSearch onSearchPress={() => {}} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Filter card */}
        <View style={s.filterCard}>
          <View style={s.filterTop}>
            <Text style={s.monthTitle}>Tháng 7, 2026</Text>
            <TouchableOpacity style={s.dateBtn}>
              <Icon name="calendar" size={16} color={COLORS.primary} />
              <Text style={s.dateBtnText}>Chọn ngày</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {CATEGORY_FILTERS.map(cat => {
              const active = selectedCat === cat;
              return (
                <TouchableOpacity key={cat} activeOpacity={0.8} style={[s.chip, active && s.activeChip]} onPress={() => setSelectedCat(cat)}>
                  <Text style={[s.chipText, active && s.activeChipText]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} /> : (
          <>
            <TxGroup label="Hôm nay" txList={todayTx} navigation={navigation} />
            <TxGroup label="Hôm qua" txList={yesterdayTx} navigation={navigation} />
          </>
        )}
      </ScrollView>

      <FloatingAddButton onPress={() => navigation.navigate('AddEditTransaction')} />
    </View>
  );
};

// ─── Transaction Group ──────────────────────────────────
function TxGroup({ label, txList, navigation }: { label: string; txList: any[]; navigation: any }) {
  if (!txList.length) return null;
  const total = txList.reduce((sum, t) => sum + t.amount, 0);
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={s.groupHeader}>
        <Text style={s.groupTitle}>{label}</Text>
        <Text style={[s.groupTotal, total < 0 ? s.expenseText : s.incomeText]}>{formatCurrency(total)}</Text>
      </View>
      <View style={s.txGroupCard}>
        {txList.map((tx, i) => (
          <TouchableOpacity key={tx.id} style={[s.txRow, i < txList.length - 1 && s.borderBottom]} onPress={() => navigation.navigate('AddEditTransaction', { transaction: tx })}>
            <View style={[s.txIcon, tx.type === 'income' && { backgroundColor: '#EAFBEE' }]}>
              <Icon name={tx.categoryIcon || 'tag'} size={18} color={tx.type === 'income' ? COLORS.safe : COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.txNote}>{tx.note || tx.categoryName}</Text>
              <Text style={s.txMeta}>12:30 PM • {PAYMENT_LABELS[tx.paymentMethod] || tx.paymentMethod}</Text>
            </View>
            <Text style={[s.txAmount, tx.type === 'expense' ? s.expenseText : s.incomeText]}>{formatCurrency(tx.amount)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 90 },
  filterCard: { backgroundColor: COLORS.card, borderRadius: RADII.card, padding: 16, marginBottom: 20, shadowColor: '#1E2233', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  filterTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  monthTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADII.button },
  dateBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADII.pill, backgroundColor: '#F3F5FA', borderWidth: 1, borderColor: COLORS.border },
  activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  activeChipText: { color: '#FFF' },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  groupTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  groupTotal: { fontSize: 13, fontWeight: '700' },
  txGroupCard: { backgroundColor: COLORS.card, borderRadius: RADII.card, paddingHorizontal: 16, shadowColor: '#1E2233', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  txIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF5EB', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txNote: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  txMeta: { fontSize: 12, color: COLORS.muted },
  txAmount: { fontSize: 15, fontWeight: '700' },
  expenseText: { color: COLORS.overBudget },
  incomeText: { color: COLORS.safe },
});
