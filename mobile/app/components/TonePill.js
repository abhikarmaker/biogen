import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radii } from '../constants/radii';

export default function TonePill({ label, isSelected, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <TouchableOpacity
      style={[styles.pill, isSelected && styles.pillSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.label, isSelected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const makeStyles = (C) => StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
    marginRight: 8,
    marginBottom: 8,
  },
  pillSelected: {
    borderColor: C.accent,
    backgroundColor: C.accentGlow,
  },
  label: { fontSize: 13, fontWeight: '500', color: C.textSecondary },
  labelSelected: { color: C.accentLight, fontWeight: '600' },
});
