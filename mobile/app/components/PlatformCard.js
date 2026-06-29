import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
export const CARD_SIZE = (width - 32 - 8) / 2;

export default function PlatformCard({ platform, isSelected, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const TYPE_META = {
    Professional: { color: colors.platformProfessional, label: 'Professional' },
    Dating:       { color: colors.platformDating,        label: 'Dating' },
    Social:       { color: colors.platformSocial,        label: 'Social' },
    Creative:     { color: colors.platformCreative,      label: 'Creative' },
  };

  const typeMeta = TYPE_META[platform.type] || TYPE_META.Social;

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {isSelected && <View style={styles.glow} pointerEvents="none" />}

      <LinearGradient
        colors={platform.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconWrap}
      >
        {platform.iconText ? (
          <Text style={styles.iconText}>{platform.iconText}</Text>
        ) : (
          <MaterialCommunityIcons name={platform.iconName} size={26} color="#fff" />
        )}
      </LinearGradient>

      <Text style={styles.name} numberOfLines={1}>{platform.name}</Text>

      <View style={[styles.badge, { backgroundColor: `${typeMeta.color}22` }]}>
        <View style={[styles.badgeDot, { backgroundColor: typeMeta.color }]} />
        <Text style={[styles.badgeText, { color: typeMeta.color }]}>{typeMeta.label}</Text>
      </View>

      {isSelected && (
        <View style={styles.check}>
          <MaterialCommunityIcons name="check-circle" size={20} color={colors.accent} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const makeStyles = (C) => StyleSheet.create({
  card: {
    width: CARD_SIZE,
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    marginBottom: 8,
    minHeight: 148,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  cardSelected: {
    borderColor: C.accent,
    backgroundColor: C.surfaceHigh,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.accentGlow,
    borderRadius: 18,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  name: { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginBottom: 7, textAlign: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  check: { position: 'absolute', top: 9, right: 9 },
  iconText: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -1 },
});
