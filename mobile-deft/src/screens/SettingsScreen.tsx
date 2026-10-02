/**
 * SettingsScreen — Profile, display name edit, logout.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { Toast } from '../components/Toast';
import { COLORS, RADII } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { updateMe } from '../api/services/userService';
import { USE_MOCK } from '../api/apiClient';

export const SettingsScreen = ({ navigation }: any) => {
  const { logout, user, updateUser } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSaveName = async () => {
    const name = displayName.trim();
    if (!name) return showMsg('Tên hiển thị không được trống.');
    setSaving(true);
    try {
      if (!USE_MOCK) {
        const updated = await updateMe({ display_name: name });
        updateUser(updated);
      } else {
        updateUser({ display_name: name });
      }
      setShowEditName(false);
      showMsg('Đã cập nhật tên.');
    } catch {
      showMsg('Cập nhật thất bại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.container}>
      <Toast message={toast} type="success" visible={!!toast} />
      <Header title="Deft Finance" showBack onBackPress={() => navigation.goBack()} showSearch onSearchPress={() => {}} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.profileCard}>
          <View style={s.avatarWrap}>
            <View style={s.avatarPlaceholder}>
              <Text style={s.avatarInitial}>{(user?.display_name || '?')[0].toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={s.editBadge} onPress={() => { setDisplayName(user?.display_name || ''); setShowEditName(true); }}>
              <Icon name="pencil" size={12} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={s.userName}>{user?.display_name || '—'}</Text>
          <Text style={s.userEmail}>{user?.email || '—'}</Text>
        </View>

        <Text style={s.sectionTitle}>Tùy chọn hiển thị</Text>
        <View style={s.group}>
          <SettingRow
            icon="creditCard"
            title="Loại tiền tệ chính"
            subtitle={user?.currency === 'VND' ? 'Việt Nam Đồng (VND)' : user?.currency || 'VND'}
          />
        </View>

        <Text style={s.sectionTitle}>Thông báo</Text>
        <View style={s.group}>
          <SettingRow
            icon="bell"
            title="Thông báo trong app"
            subtitle="Cảnh báo ngưỡng ngân sách (MVP)"
            toggle={pushEnabled}
            onToggle={setPushEnabled}
          />
        </View>

        <TouchableOpacity style={s.logoutBtn} activeOpacity={0.8} disabled={loggingOut} onPress={handleLogout}>
          {loggingOut ? (
            <ActivityIndicator color={COLORS.overBudget} />
          ) : (
            <>
              <Icon name="logOut" size={18} color={COLORS.overBudget} />
              <Text style={s.logoutText}>Đăng xuất</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showEditName} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Đổi tên hiển thị</Text>
            <TextInput style={s.fieldInput} value={displayName} onChangeText={setDisplayName} placeholder="Tên hiển thị" />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowEditName(false)}>
                <Text style={s.cancelBtnText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} disabled={saving} onPress={handleSaveName}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveBtnText}>Lưu</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

function SettingRow({ icon, title, subtitle, toggle, onToggle }: any) {
  return (
    <View style={s.settingRow}>
      <View style={s.rowLeft}>
        <View style={s.rowIcon}>
          <Icon name={icon} size={18} color={COLORS.primary} />
        </View>
        <View>
          <Text style={s.rowTitle}>{title}</Text>
          {subtitle && <Text style={s.rowSub}>{subtitle}</Text>}
        </View>
      </View>
      {toggle !== undefined && (
        <Switch value={toggle} onValueChange={onToggle} trackColor={{ false: COLORS.border, true: '#25CE6A' }} thumbColor="#FFF" />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 40 },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.card,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
  },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userName: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  userEmail: { fontSize: 13, color: COLORS.muted },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.muted, marginBottom: 8, marginLeft: 4 },
  group: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.card,
    paddingHorizontal: 16,
    marginBottom: 20,
    elevation: 1,
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  rowSub: { fontSize: 12, color: COLORS.muted },
  logoutBtn: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.button,
    borderWidth: 1.5,
    borderColor: '#FFC5CB',
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  logoutText: { color: COLORS.overBudget, fontSize: 15, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(30,34,51,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  fieldInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#FAFBFE',
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.button,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: { fontWeight: '700', color: COLORS.text },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADII.button,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFF', fontWeight: '700' },
});
