/**
 * CategoryManagementScreen — Segmented control, grid, CRUD categories.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Header } from '../components/Header';
import { SegmentedControl } from '../components/SegmentedControl';
import { Icon } from '../components/Icon';
import { Toast } from '../components/Toast';
import { COLORS, RADII } from '../constants/theme';
import {
  createCategory,
  deleteCategory,
  listCategories,
} from '../api/services/categoryService';
import type { Category } from '../../../shared/types';

export const CategoryManagementScreen = ({ navigation }: any) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'expense' | 'income'>('expense');
  const [toast, setToast] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const showMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await listCategories());
    } catch {
      showMsg('Không tải được danh mục.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const filtered = categories.filter((c) => c.type === selectedType);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return showMsg('Nhập tên danh mục.');
    setSaving(true);
    try {
      await createCategory({ name, type: selectedType, icon: 'tag' });
      setNewName('');
      setShowAdd(false);
      showMsg('Đã thêm danh mục.');
      await loadData();
    } catch {
      showMsg('Thêm danh mục thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (cat: Category) => {
    Alert.alert('Xoá danh mục', `Xoá "${cat.name}"?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory(cat.id);
            showMsg('Đã xoá danh mục.');
            await loadData();
          } catch (e: any) {
            const msg = e?.response?.data?.message;
            showMsg(typeof msg === 'string' ? msg : 'Không thể xoá danh mục đang được sử dụng.');
          }
        },
      },
    ]);
  };

  return (
    <View style={s.container}>
      <Toast message={toast} type="success" visible={!!toast} />
      <Header title="Deft Finance" showBack onBackPress={() => navigation.goBack()} showSearch onSearchPress={() => {}} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>Quản lý danh mục</Text>

        <View style={{ marginBottom: 20 }}>
          <SegmentedControl
            options={[
              { label: 'Chi tiêu', value: 'expense' },
              { label: 'Thu nhập', value: 'income' },
            ]}
            selectedValue={selectedType}
            onChange={(v) => setSelectedType(v as 'expense' | 'income')}
            activeColor={selectedType === 'expense' ? '#FF4D5E' : '#2FBF71'}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : filtered.length === 0 ? (
          <Text style={s.emptySub}>Chưa có danh mục {selectedType === 'expense' ? 'chi tiêu' : 'thu nhập'}.</Text>
        ) : (
          <View style={s.grid}>
            {filtered.map((cat) => (
              <TouchableOpacity key={cat.id} style={s.gridCard} onLongPress={() => handleDelete(cat)}>
                <View style={s.gridTop}>
                  <View style={s.catIconCircle}>
                    <Icon name={cat.icon || 'tag'} size={20} color={COLORS.primary} />
                  </View>
                  <View style={s.chipBadge}>
                    <Text style={s.chipText}>{cat.type === 'expense' ? 'Chi' : 'Thu'}</Text>
                  </View>
                </View>
                <Text style={s.catName}>{cat.name}</Text>
                <Text style={s.txCount}>Giữ để xoá</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={s.addBtn} activeOpacity={0.85} onPress={() => setShowAdd(true)}>
          <Icon name="plus" size={20} color="#FFF" />
          <Text style={s.addBtnText}>Thêm danh mục</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Thêm danh mục {selectedType === 'expense' ? 'chi tiêu' : 'thu nhập'}</Text>
            <TextInput
              style={s.fieldInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Tên danh mục"
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={s.cancelBtnText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} disabled={saving} onPress={handleAdd}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveBtnText}>Thêm</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  gridCard: {
    width: '47%',
    backgroundColor: COLORS.card,
    borderRadius: RADII.card,
    padding: 16,
    elevation: 1,
  },
  gridTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  catIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipBadge: { backgroundColor: '#F3F5FA', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  chipText: { fontSize: 11, fontWeight: '600', color: COLORS.muted },
  catName: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  txCount: { fontSize: 11, color: COLORS.muted },
  emptySub: { fontSize: 13, color: COLORS.muted, textAlign: 'center', marginBottom: 20 },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADII.button,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 4,
  },
  addBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
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
