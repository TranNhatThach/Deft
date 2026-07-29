/**
 * Toast — Top notification bar for success/error/info messages.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { COLORS, RADII } from '../constants/theme';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
}

const BG_MAP = { error: COLORS.overBudget, info: COLORS.primary, success: COLORS.safe };
const ICON_MAP = { error: 'alertTriangle', info: 'check', success: 'check' };

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', visible }) => {
  if (!visible) return null;
  return (
    <View style={[s.container, { backgroundColor: BG_MAP[type] }]}>
      <Icon name={ICON_MAP[type]} size={18} color="#FFF" />
      <Text style={s.text}>{message}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  container: { position: 'absolute', top: 50, left: 20, right: 20, borderRadius: RADII.button, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6 },
  text: { color: '#FFF', fontSize: 14, fontWeight: '600', flex: 1 },
});
