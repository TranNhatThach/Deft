/**
 * NotificationsScreen — Grouped by HÔM NAY / HÔM QUA with colored border cards.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { Badge } from '../components/Badge';
import { COLORS, RADII } from '../constants/theme';
import { USE_MOCK } from '../api/apiClient';
import { MockServer } from '../api/mockServer';

export const NotificationsScreen = ({ navigation }: any) => {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = USE_MOCK ? MockServer.getNotifications() : [];
    setNotifs(data);
    setLoading(false);
  }, []);

  const todayNotifs = notifs.filter(n => n.group === 'today');
  const yesterdayNotifs = notifs.filter(n => n.group === 'yesterday');

  const markAllRead = () => setNotifs(notifs.map(n => ({ ...n, isRead: true })));

  return (
    <View style={s.container}>
      <Header title="Deft Finance" showBack onBackPress={() => navigation.goBack()} rightActionText="Đánh dấu đã đọc" onRightActionPress={markAllRead} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>Trung tâm thông báo</Text>

        {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} /> : (
          <>
            <NotifSection label="HÔM NAY" items={todayNotifs} navigation={navigation} />
            <NotifSection label="HÔM QUA" items={yesterdayNotifs} navigation={navigation} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

// ─── Notification Section ────────────────────────────────
function NotifSection({ label, items, navigation }: { label: string; items: any[]; navigation: any }) {
  if (!items.length) return null;
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={s.sectionTitle}>{label}</Text>
      {items.map(n => <NotifCard key={n.id} notif={n} navigation={navigation} />)}
    </View>
  );
}

// ─── Notification Card ───────────────────────────────────
const BORDER_COLORS: Record<string, string> = {
  over_budget: COLORS.overBudget, warning_80: COLORS.warning,
  warning_50: COLORS.attention, transaction_alert: COLORS.primary,
};
const CIRCLE_BGS: Record<string, string> = {
  over_budget: '#FFEFEF', warning_80: '#FFF6E5',
  warning_50: '#FFFDEB', transaction_alert: '#EEF2FF',
};
const ICON_COLORS: Record<string, string> = {
  over_budget: COLORS.overBudget, warning_80: COLORS.warning,
  warning_50: COLORS.attention, transaction_alert: COLORS.primary,
};

function NotifCard({ notif, navigation }: { notif: any; navigation: any }) {
  const borderColor = BORDER_COLORS[notif.type] || COLORS.border;
  const circleBg = CIRCLE_BGS[notif.type] || '#F3F5FA';
  const iconColor = ICON_COLORS[notif.type] || COLORS.primary;
  const iconName = notif.type === 'transaction_alert' ? 'zap' : 'alertTriangle';

  return (
    <View style={[s.card, { borderLeftColor: borderColor }]}>
      <View style={s.cardHeader}>
        <View style={s.topLeft}>
          <View style={[s.iconCircle, { backgroundColor: circleBg }]}><Icon name={iconName} size={18} color={iconColor} /></View>
          <Text style={s.timeText}>{notif.createdAt}</Text>
        </View>
        <Badge type={notif.type} />
      </View>

      <Text style={s.notifTitle}>{notif.title}</Text>
      <Text style={s.notifMessage}>{notif.message}</Text>

      {notif.type === 'over_budget' && (
        <View style={s.btnRow}>
          <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.navigate('TransactionsTab')}>
            <Text style={s.primaryBtnText}>Xem giao dịch</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.navigate('BudgetTab')}>
            <Text style={s.secondaryBtnText}>Điều chỉnh hạn mức</Text>
          </TouchableOpacity>
        </View>
      )}
      {notif.type === 'transaction_alert' && (
        <TouchableOpacity style={[s.secondaryBtn, { width: 130, marginTop: 12 }]} onPress={() => navigation.navigate('TransactionsTab')}>
          <Text style={s.secondaryBtnText}>Xem chi tiết</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.muted, letterSpacing: 0.8, marginBottom: 10 },
  card: { backgroundColor: COLORS.card, borderRadius: RADII.card, padding: 16, marginBottom: 12, shadowColor: '#1E2233', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, borderLeftWidth: 4, borderLeftColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  topLeft: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  timeText: { fontSize: 12, color: COLORS.muted },
  notifTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  notifMessage: { fontSize: 13, color: COLORS.muted, lineHeight: 18 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  primaryBtn: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 10, borderRadius: RADII.button, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  secondaryBtn: { flex: 1, backgroundColor: '#EEF2FF', paddingVertical: 10, borderRadius: RADII.button, alignItems: 'center' },
  secondaryBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
});
