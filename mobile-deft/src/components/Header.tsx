/**
 * Header — Top bar with back button, title, search, and optional right action.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from './Icon';
import { COLORS } from '../constants/theme';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showSearch?: boolean;
  onSearchPress?: () => void;
  rightActionText?: string;
  onRightActionPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title, showBack, onBackPress, showSearch, onSearchPress,
  rightActionText, onRightActionPress,
}) => (
  <View style={s.container}>
    <View style={s.left}>
      {showBack ? (
        <TouchableOpacity style={s.backBtn} onPress={onBackPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrowLeft" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      ) : <View style={{ width: 10 }} />}
    </View>

    <Text style={s.title} numberOfLines={1}>{title}</Text>

    <View style={s.right}>
      {showSearch && (
        <TouchableOpacity style={s.iconBtn} onPress={onSearchPress}>
          <Icon name="search" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      )}
      {rightActionText && (
        <TouchableOpacity onPress={onRightActionPress}>
          <Text style={s.rightText}>{rightActionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const s = StyleSheet.create({
  container: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: COLORS.background },
  left: { width: 40, alignItems: 'flex-start' },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#2650cf', textAlign: 'center', flex: 1 },
  right: { minWidth: 40, alignItems: 'flex-end', justifyContent: 'center' },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  rightText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
});
