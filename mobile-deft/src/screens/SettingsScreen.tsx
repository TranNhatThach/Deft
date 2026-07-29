/**
 * SettingsScreen — Profile card, grouped settings with toggles, logout.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image, ActivityIndicator } from 'react-native';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { COLORS, RADII } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export const SettingsScreen = ({ navigation }: any) => {
  const { logout, user } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [weeklyEmail, setWeeklyEmail] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); } catch { /* silent */ }
    finally { setLoggingOut(false); }
  };

  return (
    <View style={s.container}>
      <Header title="Deft Finance" showBack onBackPress={() => navigation.goBack()} showSearch onSearchPress={() => {}} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={s.profileCard}>
          <View style={s.avatarWrap}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' }} style={s.avatar} />
            <TouchableOpacity style={s.editBadge}><Icon name="pencil" size={12} color="#FFF" /></TouchableOpacity>
          </View>
          <Text style={s.userName}>{user?.display_name || 'Nguyễn Văn A'}</Text>
          <Text style={s.userEmail}>{user?.email || 'nguyen.vana@example.com'}</Text>
        </View>

        {/* Display settings */}
        <Text style={s.sectionTitle}>Tùy chọn hiển thị</Text>
        <View style={s.group}>
          <SettingRow icon="creditCard" title="Loại tiền tệ chính" subtitle="Việt Nam Đồng (VND)" showChevron />
          <View style={s.divider} />
          <SettingRow icon="moon" title="Giao diện" subtitle="Chế độ sáng" showChevron />
        </View>

        {/* Notifications */}
        <Text style={s.sectionTitle}>Thông báo</Text>
        <View style={s.group}>
          <SettingRow icon="bell" title="Bật thông báo biến động" subtitle="Nhận thông báo khi số dư thay đổi" toggle={pushEnabled} onToggle={setPushEnabled} />
          <View style={s.divider} />
          <SettingRow icon="mail" title="Email báo cáo tuần" subtitle="Tổng hợp chi tiêu hàng tuần" toggle={weeklyEmail} onToggle={setWeeklyEmail} />
        </View>

        {/* Security */}
        <Text style={s.sectionTitle}>Bảo mật</Text>
        <View style={s.group}>
          <SettingRow icon="lock" title="Đổi mật khẩu" showChevron />
          <View style={s.divider} />
          <SettingRow icon="fingerprint" title="Xác thực sinh trắc học" showChevron />
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} activeOpacity={0.8} disabled={loggingOut} onPress={handleLogout}>
          {loggingOut ? <ActivityIndicator color={COLORS.overBudget} /> : (
            <><Icon name="logOut" size={18} color={COLORS.overBudget} /><Text style={s.logoutText}>Đăng xuất</Text></>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ─── Setting Row ─────────────────────────────────────────
function SettingRow({ icon, title, subtitle, showChevron, toggle, onToggle }: any) {
  return (
    <View style={s.settingRow}>
      <View style={s.rowLeft}>
        <View style={s.rowIcon}><Icon name={icon} size={18} color={COLORS.primary} /></View>
        <View>
          <Text style={s.rowTitle}>{title}</Text>
          {subtitle && <Text style={s.rowSub}>{subtitle}</Text>}
        </View>
      </View>
      {showChevron && <Icon name="chevronRight" size={18} color={COLORS.muted} />}
      {toggle !== undefined && <Switch value={toggle} onValueChange={onToggle} trackColor={{ false: COLORS.border, true: '#25CE6A' }} thumbColor="#FFF" />}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 40 },
  profileCard: { backgroundColor: COLORS.card, borderRadius: RADII.card, padding: 20, alignItems: 'center', marginBottom: 24, shadowColor: '#1E2233', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  userName: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  userEmail: { fontSize: 13, color: COLORS.muted },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.muted, marginBottom: 8, marginLeft: 4 },
  group: { backgroundColor: COLORS.card, borderRadius: RADII.card, paddingHorizontal: 16, marginBottom: 20, shadowColor: '#1E2233', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  rowSub: { fontSize: 12, color: COLORS.muted },
  divider: { height: 1, backgroundColor: COLORS.border },
  logoutBtn: { backgroundColor: COLORS.card, borderRadius: RADII.button, borderWidth: 1.5, borderColor: '#FFC5CB', paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  logoutText: { color: COLORS.overBudget, fontSize: 15, fontWeight: '800' },
});
