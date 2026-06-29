import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProBadge({ size = 'sm' }) {
  const isLg = size === 'lg';
  return (
    <LinearGradient
      colors={['#FFD700', '#FFA500']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.badge, isLg && styles.badgeLg]}
    >
      <Text style={[styles.text, isLg && styles.textLg]}>PRO</Text>
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
    color: '#1A1000',
    letterSpacing: 0.8,
  },
  textLg: {
    fontSize: 12,
    letterSpacing: 1,
  },
});
