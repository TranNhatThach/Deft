/**
 * AddEditTransactionModalScreen — Bottom sheet with segmented control, amount, categories, date/note.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SegmentedControl } from '../components/SegmentedControl';
import { Icon } from '../components/Icon';
import { Toast } from '../components/Toast';
import { COLORS, RADII } from '../constants/theme';
import { apiClient, USE_MOCK } from '../api/apiClient';
import { MockServer } from '../api/mockServer';

export const AddEditTransactionModalScreen = ({ navigation, route }: any) => {
  const existingTx = route.params?.transaction;
  const isEditing = !!existingTx;

  const [type, setType] = useState(existingTx?.type || 'expense');
  const [amount, setAmount] = useState(existingTx ? Math.abs(existingTx.amount).toString() : '');
  const [selectedCatId, setSelectedCatId] = useState(existingTx?.categoryId || '');
  const [date, setDate] = useState('25/07/2026');
  const [note, setNote] = useState(existingTx?.note || '');
  const [categories, setCategories] = useState<any[]>([]);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const cats = USE_MOCK ? MockServer.getCategories() : [];
    setCategories(cats);
    if (!selectedCatId && cats.length) setSelectedCatId(cats[0].id);
  }, []);

  const activeCats = categories.filter(c => c.type === type);
  const selectedCat = categories.find(c => c.id === selectedCatId) || activeCats[0];
  const showError = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSave = async () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return showError('Vui lòng nhập số tiền hợp lệ');
    setSaving(true);
    try {
      const payload = { amount: num, type, categoryId: selectedCat?.id, note, date: new Date().toISOString(), paymentMethod: 'cash' };
      if (!USE_MOCK) {
        if (isEditing) await apiClient.patch(`/api/transactions/${existingTx.id}`, payload);
        else await apiClient.post('/api/transactions', payload);
      }
      navigation.goBack();
    } catch { showError('Lưu giao dịch thất bại.'); }
    finally { setSaving(false); }
  };

  return (
    <View style={s.container}>
      <Toast message={toast} type="error" visible={!!toast} />
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => navigation.goBack()} />

      <View style={s.sheet}>
        <View style={s.dragHandle} />
        <Text style={s.sheetTitle}>{isEditing ? 'Sửa giao dịch' : 'Thêm giao dịch'}</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
          <View style={{ marginBottom: 20 }}>
            <SegmentedControl
              options={[{ label: '↓ Chi tiêu', value: 'expense' }, { label: '↑ Thu nhập', value: 'income' }]}
              selectedValue={type}
              onChange={(v) => { setType(v); const nc = categories.filter(c => c.type === v); if (nc.length) setSelectedCatId(nc[0].id); }}
              activeColor={type === 'expense' ? '#FFE8E8' : '#EAFBEE'}
            />
          </View>

          {/* Amount */}
          <View style={s.amountBox}>
            <TextInput style={s.amountInput} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" />
            <Text style={s.amountUnit}>VNĐ</Text>
          </View>

          {/* Category selector */}
          <View style={s.catHeader}>
            <Text style={s.sectionLabel}>DANH MỤC</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CategoryManagement')}>
              <Text style={s.seeAll}>Xem tất cả ›</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, marginBottom: 20 }}>
            {activeCats.map(cat => {
              const active = cat.id === selectedCatId;
              return (
                <TouchableOpacity key={cat.id} activeOpacity={0.8} style={{ alignItems: 'center' }} onPress={() => setSelectedCatId(cat.id)}>
                  <View style={[s.catIcon, active && s.catIconActive]}>
                    <Icon name={cat.icon || 'tag'} size={22} color={active ? '#FFF' : COLORS.primary} />
                  </View>
                  <Text style={[s.catName, active && { color: COLORS.primary, fontWeight: '700' }]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Date */}
          <View style={s.fieldBox}>
            <Icon name="calendar" size={18} color={COLORS.muted} />
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Ngày giao dịch</Text>
              <TextInput style={s.fieldInput} value={date} onChangeText={setDate} />
            </View>
            <Icon name="calendar" size={18} color={COLORS.muted} />
          </View>

          {/* Note */}
          <View style={s.fieldBox}>
            <Icon name="alignLeft" size={18} color={COLORS.muted} />
            <TextInput style={s.fieldInputFull} value={note} onChangeText={setNote} placeholder="Thêm ghi chú..." placeholderTextColor={COLORS.muted} />
          </View>

          {/* Save */}
          <TouchableOpacity style={s.saveBtn} activeOpacity={0.85} disabled={saving} onPress={handleSave}>
            {saving ? <ActivityIndicator color="#FFF" /> : (
              <><Text style={s.saveBtnText}>Lưu giao dịch</Text><Icon name="check" size={18} color="#FFF" /></>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(30,34,51,0.4)' },
  sheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingHorizontal: 20, maxHeight: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  dragHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#E2E5F0', alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 16 },
  amountBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 10 },
  amountInput: { fontSize: 32, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginRight: 8 },
  amountUnit: { fontSize: 18, fontWeight: '700', color: COLORS.muted },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.muted, letterSpacing: 0.5 },
  seeAll: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  catIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  catIconActive: { backgroundColor: COLORS.primary },
  catName: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  fieldBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADII.input, paddingHorizontal: 14, height: 52, marginBottom: 12, backgroundColor: '#FAFBFE', gap: 10 },
  fieldLabel: { fontSize: 10, color: COLORS.muted },
  fieldInput: { fontSize: 14, fontWeight: '600', color: COLORS.text, padding: 0 },
  fieldInputFull: { flex: 1, fontSize: 14, color: COLORS.text },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: RADII.button, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
