/**
 * NotificationsScreen — Grouped notifications with mark-read actions.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { Badge } from '../components/Badge';
import { COLORS, RADII } from '../constants/theme';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/services/notificationService';
import type { NotificationListItem } from '../api/mappers';

export const NotificationsScreen = ({ navigation }: any) => {
  const [notifs, setNotifs] = useState<NotificationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { items } = await listNotifications();
      setNotifs(items);
    } catch {
      setError('Không tải được thông báo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifs(notifs.map((n) => ({ ...n, isRead: true })));
    } catch {
      setError('Không thể đánh dấu đã đọc.');
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifs(notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      /* ignore */
    }
  };

  const todayNotifs = notifs.filter((n) => n.group === 'today');
  const yesterdayNotifs = notifs.filter((n) => n.group === 'yesterday');
  const olderNotifs = notifs.filter((n) => n.group === 'older');

  return (
    <View style={s.container}>
      <Header
        title="Deft Finance"
        showBack
        onBackPress={() => navigation.goBack()}
        rightActionText="Đánh dấu đã đọc"
        onRightActionPress={markAllRead}
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>Trung tâm thông báo</Text>
        {error ? <Text style={s.errorText}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : notifs.length === 0 ? (
          <Text style={s.emptyText}>Chưa có thông báo nào.</Text>
        ) : (
          <>
            <NotifSection label="HÔM NAY" items={todayNotifs} navigation={navigation} onRead={markOneRead} />
            <NotifSection label="HÔM QUA" items={yesterdayNotifs} navigation={navigation} onRead={markOneRead} />
            <NotifSection label="TRƯỚC ĐÓ" items={olderNotifs} navigation={navigation} onRead={markOneRead} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

function NotifSection({
  label,
  items,
  navigation,
  onRead,
}: {
  label: string;
  items: NotificationListItem[];
  navigation: any;
  onRead: (id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={s.sectionTitle}>{label}</Text>
      {items.map((n) => (
        <NotifCard key={n.id} notif={n} navigation={navigation} onRead={() => onRead(n.id)} />
      ))}
    </View>
  );
}

const BORDER_COLORS: Record<string, string> = {
  over_budget: COLORS.overBudget,
  warning_80: COLORS.critical,
  warning_70: COLORS.warning,
  warning_50: COLORS.attention,
  transaction_alert: COLORS.primary,
};

function NotifCard({
  notif,
  navigation,
  onRead,
}: {
  notif: NotificationListItem;
  navigation: any;
  onRead: () => void;
}) {
  const borderColor = BORDER_COLORS[notif.type] || COLORS.border;
  const iconName = notif.type === 'transaction_alert' ? 'zap' : 'alertTriangle';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[s.card, { borderLeftColor: borderColor }, !notif.isRead && s.unreadCard]}
      onPress={onRead}
    >
      <View style={s.cardHeader}>
        <View style={s.topLeft}>
          <View style={[s.iconCircle, { backgroundColor: '#F3F5FA' }]}>
            <Icon name={iconName} size={18} color={borderColor} />
          </View>
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
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.muted, letterSpacing: 0.8, marginBottom: 10 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.card,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.border,
  },
  unreadCard: { backgroundColor: '#FAFBFF' },
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
  emptyText: { textAlign: 'center', color: COLORS.muted, marginTop: 24, fontSize: 14 },
  errorText: { color: COLORS.overBudget, marginBottom: 12, fontSize: 13 },
});
