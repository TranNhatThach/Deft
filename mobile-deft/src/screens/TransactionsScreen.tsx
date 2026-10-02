/**
 * TransactionsScreen — Filter chips, grouped transaction list, FAB.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { FloatingAddButton } from '../components/FloatingAddButton';
import { COLORS, RADII, formatCurrency } from '../constants/theme';
import { listTransactions } from '../api/services/transactionService';
import { listCategories } from '../api/services/categoryService';
import type { TransactionListItem } from '../api/mappers';
import type { Category } from '../../../shared/types';

function groupByDate(transactions: TransactionListItem[]): Record<string, TransactionListItem[]> {
  const groups: Record<string, TransactionListItem[]> = {};
  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  for (const tx of transactions) {
    const key =
      tx.date === today ? 'Hôm nay' : tx.date === yesterday ? 'Hôm qua' : tx.date.split('-').reverse().join('/');
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }
  return groups;
}

export const TransactionsScreen = ({ navigation, route }: any) => {
  const initialCategoryId = route.params?.categoryId as string | undefined;
  const initialCategoryName = route.params?.categoryName as string | undefined;

  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string | 'all'>(initialCategoryId || 'all');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [txs, cats] = await Promise.all([
        listTransactions(
          selectedCatId !== 'all' ? { category_id: selectedCatId, limit: 100 } : { limit: 100 },
        ),
        listCategories(),
      ]);
      setTransactions(txs);
      setCategories(cats);
    } catch {
      setError('Không tải được danh sách giao dịch.');
    } finally {
      setLoading(false);
    }
  }, [selectedCatId]);

  useFocusEffect(
    useCallback(() => {
      if (initialCategoryId) setSelectedCatId(initialCategoryId);
      loadData();
    }, [loadData, initialCategoryId]),
  );

  const filterChips = [{ id: 'all' as const, name: 'Tất cả' }, ...categories.map((c) => ({ id: c.id, name: c.name }))];
  const grouped = groupByDate(transactions);

  return (
    <View style={s.container}>
      <Header title="Giao dịch" showBack onBackPress={() => navigation.goBack()} showSearch onSearchPress={() => {}} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {initialCategoryName ? (
          <Text style={s.filterHint}>Đang lọc: {initialCategoryName}</Text>
        ) : null}

        <View style={s.filterCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {filterChips.map((cat) => {
              const active = selectedCatId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.8}
                  style={[s.chip, active && s.activeChip]}
                  onPress={() => setSelectedCatId(cat.id)}
                >
                  <Text style={[s.chipText, active && s.activeChipText]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : transactions.length === 0 ? (
          <Text style={s.emptyText}>Chưa có giao dịch nào.</Text>
        ) : (
          Object.entries(grouped).map(([label, txList]) => (
            <TxGroup key={label} label={label} txList={txList} navigation={navigation} onDeleted={loadData} />
          ))
        )}
      </ScrollView>

      <FloatingAddButton onPress={() => navigation.navigate('AddEditTransaction')} />
    </View>
  );
};

function TxGroup({
  label,
  txList,
  navigation,
}: {
  label: string;
  txList: TransactionListItem[];
  navigation: any;
  onDeleted: () => void;
}) {
  const total = txList.reduce((sum, t) => sum + t.amount, 0);
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={s.groupHeader}>
        <Text style={s.groupTitle}>{label}</Text>
        <Text style={[s.groupTotal, total < 0 ? s.expenseText : s.incomeText]}>{formatCurrency(total)}</Text>
      </View>
      <View style={s.txGroupCard}>
        {txList.map((tx, i) => (
          <TouchableOpacity
            key={tx.id}
            style={[s.txRow, i < txList.length - 1 && s.borderBottom]}
            onPress={() => navigation.navigate('AddEditTransaction', { transaction: tx })}
          >
            <View style={[s.txIcon, tx.type === 'income' && { backgroundColor: '#EAFBEE' }]}>
              <Icon
                name={tx.categoryIcon || 'tag'}
                size={18}
                color={tx.type === 'income' ? COLORS.safe : COLORS.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.txNote}>{tx.note || tx.categoryName}</Text>
              <Text style={s.txMeta}>{tx.categoryName}</Text>
            </View>
            <Text style={[s.txAmount, tx.type === 'expense' ? s.expenseText : s.incomeText]}>
              {formatCurrency(tx.amount)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 90 },
  filterHint: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginBottom: 8 },
  filterCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.card,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADII.pill,
    backgroundColor: '#F3F5FA',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  activeChipText: { color: '#FFF' },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  groupTotal: { fontSize: 13, fontWeight: '700' },
  txGroupCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.card,
    paddingHorizontal: 16,
    elevation: 2,
  },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txNote: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  txMeta: { fontSize: 12, color: COLORS.muted },
  txAmount: { fontSize: 15, fontWeight: '700' },
  expenseText: { color: COLORS.overBudget },
  incomeText: { color: COLORS.safe },
  emptyText: { textAlign: 'center', color: COLORS.muted, marginTop: 24, fontSize: 14 },
  errorText: { color: COLORS.overBudget, marginBottom: 12, fontSize: 13 },
});
