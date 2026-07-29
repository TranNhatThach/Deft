/**
 * FloatingAddButton — FAB for adding new transactions.
 */
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { COLORS } from '../constants/theme';

interface FloatingAddButtonProps { onPress: () => void; }

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onPress }) => (
  <TouchableOpacity activeOpacity={0.85} style={s.fab} onPress={onPress}>
    <Icon name="plus" size={26} color="#FFF" />
  </TouchableOpacity>
);

const s = StyleSheet.create({
  fab: { position: 'absolute', bottom: 24, right: 20, width: 54, height: 54, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8, zIndex: 90 },
});
