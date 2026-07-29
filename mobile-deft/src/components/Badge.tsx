/**
 * Badge — Colored pill showing budget status, percentage, or label.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getBudgetColor, COLORS } from '../constants/theme';

type BadgeType = 'over_budget' | 'warning_80' | 'warning_50' | 'transaction_alert' | 'active' | 'custom';

interface BadgeProps {
  percent?: number;
  label?: string;
  type?: BadgeType;
  color?: string;
  backgroundColor?: string;
}

function resolveBadge(props: BadgeProps) {
  const { percent, type, label, color, backgroundColor } = props;
  let bg = backgroundColor, text = color || '#FFF', lbl = label || '';

  if (percent !== undefined) {
    bg = getBudgetColor(percent);
    lbl = label || (percent >= 100 ? 'Vượt mức' : `${percent}%`);
  } else if (type) {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      over_budget: { bg: COLORS.overBudget, text: '#FFF', label: 'VƯỢT MỨC' },
      warning_80: { bg: COLORS.critical, text: '#FFF', label: '80%' },
      warning_50: { bg: COLORS.attention, text: '#1E2233', label: '50%' },
      transaction_alert: { bg: '#EAEFFE', text: COLORS.primary, label: 'BIẾN ĐỘNG' },
      active: { bg: COLORS.primary, text: '#FFF', label: 'Đang chạy' },
    };
    const m = map[type];
    if (m) { bg = m.bg; text = m.text; lbl = label || m.label; }
  }

  return { bg: bg || COLORS.primary, text, lbl };
}

export const Badge: React.FC<BadgeProps> = (props) => {
  const { bg, text, lbl } = resolveBadge(props);
  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <Text style={[s.text, { color: text }]}>{lbl}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  container: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, alignSelf: 'flex-start', justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
});
