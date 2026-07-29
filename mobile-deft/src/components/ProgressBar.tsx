/**
 * ProgressBar — Horizontal bar with color based on budget threshold.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { getBudgetColor } from '../constants/theme';

interface ProgressBarProps {
  percent: number;
  height?: number;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percent, height = 6, backgroundColor = '#E7EAF3', style,
}) => {
  const capped = Math.min(Math.max(percent, 0), 100);
  return (
    <View style={[s.track, { height, backgroundColor }, style]}>
      <View style={[s.fill, { width: `${capped}%`, height, backgroundColor: getBudgetColor(percent) }]} />
    </View>
  );
};

const s = StyleSheet.create({
  track: { width: '100%', borderRadius: 9999, overflow: 'hidden' },
  fill: { borderRadius: 9999 },
});
