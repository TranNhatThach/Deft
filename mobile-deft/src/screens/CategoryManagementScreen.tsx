/**
 * CategoryManagementScreen — Segmented control, 2x2 grid, empty state, add button.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Header } from '../components/Header';
import { SegmentedControl } from '../components/SegmentedControl';
import { Icon } from '../components/Icon';
import { Toast } from '../components/Toast';
import { COLORS, RADII } from '../constants/theme';
import { USE_MOCK } from '../api/apiClient';
import { MockServer } from '../api/mockServer';

export const CategoryManagementScreen = ({ navigation }: any) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('expense');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const cats = USE_MOCK ? MockServer.getCategories() : [];
    setCategories(cats);
    setLoading(false);
  }, []);

  const filtered = categories.filter(c => c.type === selectedType);
  const customCats = filtered.filter(c => c.isCustom);
  const showMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleAdd = () => {
    const newCat = { id: `cat_new_${Date.now()}`, name: selectedType === 'expense' ? 'Danh mục mới' : 'Thu nhập mới', type: selectedType, icon: 'tag', isCustom: true, transactionCount: 0 };
    setCategories([...categories, newCat]);
    showMsg('Đã thêm danh mục mới');
  };

  return (
    <View style={s.container}>
      <Toast message={toast} type="success" visible={!!toast} />
      <Header title="Deft Finance" showBack onBackPress={() => navigation.goBack()} showSearch onSearchPress={() => {}} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>Quản lý danh mục</Text>

        <View style={{ marginBottom: 20 }}>
          <SegmentedControl
            options={[{ label: 'Chi tiêu', value: 'expense' }, { label: 'Thu nhập', value: 'income' }]}
            selectedValue={selectedType}
            onChange={setSelectedType}
            activeColor={selectedType === 'expense' ? '#FF4D5E' : '#2FBF71'}
          />
        </View>

        {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} /> : (
          <>
            {/* 2x2 Grid */}
            <View style={s.grid}>
              {filtered.map(cat => (
                <View key={cat.id} style={s.gridCard}>
                  <View style={s.gridTop}>
                    <View style={s.catIconCircle}><Icon name={cat.icon || 'tag'} size={20} color={COLORS.primary} /></View>
                    <View style={s.chipBadge}><Text style={s.chipText}>{cat.type === 'expense' ? 'Chi' : 'Thu'}</Text></View>
                  </View>
                  <Text style={s.catName}>{cat.name}</Text>
                  <Text style={s.txCount}>{cat.transactionCount || 0} giao dịch</Text>
                </View>
              ))}
            </View>

            {/* Empty/custom banner */}
            <View style={s.emptyCard}>
              <View style={s.emptyIcon}><Icon name="folderOpen" size={32} color={COLORS.primary} /></View>
              <Text style={s.emptyTitle}>{customCats.length > 0 ? 'Danh mục tùy chỉnh' : 'Chưa có danh mục tùy chỉnh'}</Text>
              <Text style={s.emptySub}>Bạn có thể thêm các danh mục mới để quản lý chi tiêu chi tiết hơn.</Text>
            </View>
          </>
        )}

        <TouchableOpacity style={s.addBtn} activeOpacity={0.85} onPress={handleAdd}>
          <Icon name="plus" size={20} color="#FFF" /><Text style={s.addBtnText}>Thêm danh mục</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  gridCard: { width: '47%', backgroundColor: COLORS.card, borderRadius: RADII.card, padding: 16, shadowColor: '#1E2233', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  gridTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  catIconCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  chipBadge: { backgroundColor: '#F3F5FA', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  chipText: { fontSize: 11, fontWeight: '600', color: COLORS.muted },
  catName: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  txCount: { fontSize: 12, color: COLORS.muted },
  emptyCard: { backgroundColor: COLORS.card, borderRadius: RADII.card, borderWidth: 1, borderColor: '#E2E5F0', borderStyle: 'dashed', padding: 24, alignItems: 'center', marginBottom: 24 },
  emptyIcon: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6, textAlign: 'center' },
  emptySub: { fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 18 },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: RADII.button, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  addBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
