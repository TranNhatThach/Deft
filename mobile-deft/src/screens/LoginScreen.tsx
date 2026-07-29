/**
 * LoginScreen — Brand card login with icon inputs and footnote.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../components/Icon';
import { Toast } from '../components/Toast';
import { COLORS, RADII } from '../constants/theme';

export const LoginScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  const showError = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleLogin = async () => {
    if (!email || !password) return showError('Vui lòng nhập đầy đủ email và mật khẩu');
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err: any) {
      showError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally { setLoading(false); }
  };

  return (
    <View style={s.container}>
      <Toast message={toast} type="error" visible={!!toast} />

      <View style={s.card}>
        {/* Brand */}
        <View style={s.brandBox}><Icon name="landmark" size={28} color="#FFF" /></View>
        <Text style={s.brandTitle}>Deft Finance</Text>
        <Text style={s.brandSub}>Quản lý tài chính thông minh</Text>

        {/* Email */}
        <Text style={s.label}>Email</Text>
        <View style={s.inputRow}>
          <Icon name="mail" size={18} color={COLORS.muted} style={{ marginRight: 8 } as any} />
          <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="nhap@email.com" placeholderTextColor={COLORS.muted} keyboardType="email-address" autoCapitalize="none" />
        </View>

        {/* Password */}
        <Text style={s.label}>Mật khẩu</Text>
        <View style={s.inputRow}>
          <Icon name="lock" size={18} color={COLORS.muted} style={{ marginRight: 8 } as any} />
          <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={COLORS.muted} secureTextEntry={!showPw} />
          <TouchableOpacity onPress={() => setShowPw(!showPw)}>
            <Icon name={showPw ? 'eyeOff' : 'eye'} size={18} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.forgotBtn}><Text style={s.forgotText}>Quên mật khẩu?</Text></TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity style={s.loginBtn} activeOpacity={0.85} disabled={loading} onPress={handleLogin}>
          {loading ? <ActivityIndicator color="#FFF" /> : (
            <><Text style={s.loginText}>Đăng nhập</Text><Icon name="arrowRight" size={18} color="#FFF" /></>
          )}
        </TouchableOpacity>

        {/* Register link */}
        <View style={s.signupRow}>
          <Text style={s.signupPrompt}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={s.signupLink}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footnote */}
      <View style={s.footnoteRow}>
        <View style={s.fnItem}><Icon name="shieldCheck" size={14} color={COLORS.muted} /><Text style={s.fnText}>Bảo mật cấp ngân hàng</Text></View>
        <Text style={s.fnDot}>•</Text>
        <View style={s.fnItem}><Icon name="headphones" size={14} color={COLORS.muted} /><Text style={s.fnText}>Hỗ trợ 24/7</Text></View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#DCE6F8', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 400, backgroundColor: COLORS.card, borderRadius: RADII.card + 4, padding: 24, shadowColor: '#1E2233', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6 },
  brandBox: { width: 54, height: 54, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  brandTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 2 },
  brandSub: { fontSize: 14, color: COLORS.muted, textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADII.input, paddingHorizontal: 12, height: 46, marginBottom: 14, backgroundColor: '#FAFBFE' },
  input: { flex: 1, fontSize: 14, color: COLORS.text },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  loginBtn: { backgroundColor: COLORS.primary, borderRadius: RADII.button, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  loginText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signupPrompt: { fontSize: 13, color: COLORS.muted },
  signupLink: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  footnoteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  fnItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fnText: { fontSize: 12, color: COLORS.muted },
  fnDot: { fontSize: 12, color: COLORS.muted },
});
