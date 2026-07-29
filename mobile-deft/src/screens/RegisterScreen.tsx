/**
 * RegisterScreen — Full registration with password strength, confirm, and back button.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../components/Icon';
import { Toast } from '../components/Toast';
import { COLORS, RADII } from '../constants/theme';

export const RegisterScreen = ({ navigation }: any) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  const showError = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // Password strength: 0-4 segments
  const strength = Math.min(4, [password.length >= 6, password.length >= 8, /[A-Z]/.test(password), /\d/.test(password)].filter(Boolean).length);
  const strengthLabels = ['', 'Yếu', 'Khá', 'Mạnh', 'Rất mạnh'];
  const strengthColors = ['#E7EAF3', '#FF4D5E', '#FFC24B', '#2FBF71', '#2FBF71'];

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPw) return showError('Vui lòng điền đầy đủ các thông tin');
    if (password !== confirmPw) return showError('Mật khẩu xác nhận không trùng khớp');
    setLoading(true);
    try {
      await register({ display_name: name, email: email.trim(), password });
    } catch { showError('Đăng ký thất bại. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  };

  return (
    <View style={s.container}>
      <Toast message={toast} type="error" visible={!!toast} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrowLeft" size={20} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={s.title}>Tạo tài khoản mới</Text>
        <Text style={s.subtitle}>Bắt đầu hành trình quản lý tài chính thông minh cùng Deft Finance.</Text>

        <View style={s.card}>
          <InputField label="Tên hiển thị" icon="user" value={name} onChange={setName} placeholder="Ví dụ: Nguyễn Văn A" />
          <InputField label="Email" icon="mail" value={email} onChange={setEmail} placeholder="email@example.com" keyboardType="email-address" />
          <InputField label="Mật khẩu" icon="lock" value={password} onChange={setPassword} placeholder="••••••••" secure={!showPw} onToggle={() => setShowPw(!showPw)} showToggle />

          {/* Strength bar */}
          <View style={s.strengthRow}>
            {[0, 1, 2, 3].map(i => <View key={i} style={[s.strengthSeg, i < strength && { backgroundColor: strengthColors[strength] }]} />)}
          </View>
          {strength > 0 && <Text style={[s.strengthLabel, { color: strengthColors[strength] }]}>Độ mạnh: {strengthLabels[strength]}</Text>}

          <InputField label="Xác nhận mật khẩu" icon="rotateCcw" value={confirmPw} onChange={setConfirmPw} placeholder="••••••••" secure={!showPw} />

          <TouchableOpacity style={s.regBtn} activeOpacity={0.85} disabled={loading} onPress={handleRegister}>
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <><Text style={s.regBtnText}>Đăng ký</Text><Icon name="arrowRight" size={18} color="#FFF" /></>
            )}
          </TouchableOpacity>
        </View>

        <View style={s.loginRow}>
          <Text style={s.loginPrompt}>Đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}><Text style={s.loginLink}>Đăng nhập</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Reusable Input Field ────────────────────────────────
function InputField({ label, icon, value, onChange, placeholder, keyboardType, secure, showToggle, onToggle }: any) {
  return (
    <>
      <Text style={s.inputLabel}>{label}</Text>
      <View style={s.inputRow}>
        <Icon name={icon} size={18} color={COLORS.muted} style={{ marginRight: 8 } as any} />
        <TextInput style={s.textInput} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={COLORS.muted} keyboardType={keyboardType} autoCapitalize="none" secureTextEntry={secure} />
        {showToggle && <TouchableOpacity onPress={onToggle}><Icon name={secure ? 'eye' : 'eyeOff'} size={18} color={COLORS.muted} /></TouchableOpacity>}
      </View>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingTop: 40, paddingBottom: 40 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#1E2233', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.muted, lineHeight: 20, marginBottom: 20 },
  card: { backgroundColor: COLORS.card, borderRadius: RADII.card + 2, padding: 20, marginBottom: 20, shadowColor: '#1E2233', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 3 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADII.input, paddingHorizontal: 12, height: 46, marginBottom: 14, backgroundColor: '#FAFBFE' },
  textInput: { flex: 1, fontSize: 14, color: COLORS.text },
  strengthRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  strengthSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E7EAF3' },
  strengthLabel: { fontSize: 11, fontWeight: '600', marginBottom: 14 },
  regBtn: { backgroundColor: COLORS.primary, borderRadius: RADII.button, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  regBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginPrompt: { fontSize: 13, color: COLORS.muted },
  loginLink: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
});
