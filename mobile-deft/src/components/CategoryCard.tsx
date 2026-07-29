/**
 * CategoryCard — Dashboard card showing category budget, progress, and metrics.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from './Icon';
import { ProgressBar } from './ProgressBar';
import { Badge } from './Badge';
import { COLORS, RADII, formatNumberOnly } from '../constants/theme';

interface Budget {
  id: string;
  categoryName: string;
  categoryIcon: string;
  amount: number;
  spent: number;
  percent: number;
}

interface CategoryCardProps {
  budget: Budget;
  currency?: string;
  onPress?: () => void;
}

function getIconBg(budget: Budget) {
  if (budget.spent > budget.amount) return '#FFEFEF';
  if (budget.percent >= 80) return '#FFF6E5';
  return '#EAF0FF';
}

function getIconColor(budget: Budget) {
  if (budget.spent > budget.amount) return COLORS.overBudget;
  if (budget.percent >= 80) return COLORS.warning;
  return COLORS.primary;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ budget, onPress }) => {
  const over = budget.spent > budget.amount;
  const diff = over ? budget.spent - budget.amount : budget.amount - budget.spent;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[s.card, over && s.overCard]}>
      <View style={s.headerRow}>
        <View style={s.leftHeader}>
          <View style={[s.iconCircle, { backgroundColor: getIconBg(budget) }]}>
            <Icon name={budget.categoryIcon} size={20} color={getIconColor(budget)} />
          </View>
          <Text style={s.title}>{budget.categoryName}</Text>
        </View>
        {over && <Badge label="Vượt mức" percent={100} />}
      </View>

      <View style={s.progressWrap}><ProgressBar percent={budget.percent} height={6} /></View>

      <View style={s.metricsRow}>
        <View style={s.metric}>
          <Text style={s.metricLabel}>Đã chi</Text>
          <Text style={[s.metricVal, over && s.overText]}>{formatNumberOnly(budget.spent)}</Text>
        </View>
        <View style={s.metric}>
          <Text style={s.metricLabel}>{over ? 'Vượt quá' : 'Còn lại'}</Text>
          <Text style={[s.metricVal, over && s.overText]}>{over ? `-${formatNumberOnly(diff)}` : formatNumberOnly(diff)}</Text>
        </View>
        <View style={s.metricRight}>
          <Text style={s.metricLabel}>Hạn mức</Text>
          <Text style={s.metricVal}>{formatNumberOnly(budget.amount)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: RADII.card, padding: 16, marginBottom: 12, shadowColor: '#1E2233', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: 'transparent' },
  overCard: { borderColor: '#FFC5CB' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  leftHeader: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  progressWrap: { marginBottom: 12 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metric: { flex: 1 },
  metricRight: { flex: 1, alignItems: 'flex-end' },
  metricLabel: { fontSize: 11, color: COLORS.muted, marginBottom: 2 },
  metricVal: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  overText: { color: COLORS.overBudget },
});
