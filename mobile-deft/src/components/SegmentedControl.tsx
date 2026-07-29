/**
 * SegmentedControl — Pill toggle between two options (expense/income, etc).
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADII } from '../constants/theme';

interface Option { label: string; value: string; }

interface SegmentedControlProps {
  options: Option[];
  selectedValue: string;
  onChange: (value: string) => void;
  activeColor?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options, selectedValue, onChange, activeColor,
}) => (
  <View style={s.container}>
    {options.map((opt) => {
      const active = opt.value === selectedValue;
      const bg = active ? (activeColor || (opt.value === 'expense' ? '#FF4D5E' : '#2FBF71')) : 'transparent';
      return (
        <TouchableOpacity key={opt.value} activeOpacity={0.8} style={[s.segment, active && { backgroundColor: bg }]} onPress={() => onChange(opt.value)}>
          <Text style={[s.text, { color: active ? '#FFF' : COLORS.muted }]}>{opt.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const s = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: '#EAEDF6', borderRadius: RADII.button, padding: 4 },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: RADII.button - 2 },
  text: { fontSize: 14, fontWeight: '700' },
});
