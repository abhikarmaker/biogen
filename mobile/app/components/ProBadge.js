import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export default function ProBadge({ size = 'sm' }) {
  const { colors } = useTheme();
  const isLg = size === 'lg';
  return (
    <LinearGradient
      colors={[colors.proGold, colors.proGoldDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.badge, isLg && styles.badgeLg]}
    >
      <Text style={[styles.text, { color: colors.proText }, isLg && styles.textLg]}>PRO</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeLg: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 7,
  },
  text: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  textLg: {
    fontSize: 12,
    letterSpacing: 1,
  },
});
