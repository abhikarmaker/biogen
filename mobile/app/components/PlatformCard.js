import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';

const { width } = Dimensions.get('window');
// 2 columns, 16px outer padding each side, 8px gap between cards
export const CARD_SIZE = (width - 32 - 8) / 2;

const TYPE_META = {
  Professional: { color: Colors.platformProfessional, label: 'Professional' },
  Dating:       { color: Colors.platformDating,        label: 'Dating' },
  Social:       { color: Colors.platformSocial,        label: 'Social' },
};

export default function PlatformCard({ platform, isSelected, onPress }) {
  const typeMeta = TYPE_META[platform.type] || TYPE_META.Social;

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Glow overlay when selected */}
      {isSelected && <View style={styles.glow} pointerEvents="none" />}

      {/* Icon circle */}
      <LinearGradient
        colors={platform.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconWrap}
      >
        <MaterialCommunityIcons name={platform.iconName} size={26} color="#fff" />
      </LinearGradient>

      {/* Name */}
      <Text style={styles.name} numberOfLines={1}>
        {platform.name}
      </Text>

      {/* Type badge */}
      <View style={[styles.badge, { backgroundColor: `${typeMeta.color}22` }]}>
        <View style={[styles.badgeDot, { backgroundColor: typeMeta.color }]} />
        <Text style={[styles.badgeText, { color: typeMeta.color }]}>
          {typeMeta.label}
        </Text>
      </View>

      {/* Selected checkmark */}
      {isSelected && (
        <View style={styles.check}>
          <MaterialCommunityIcons
            name="check-circle"
            size={20}
            color={Colors.accent}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_SIZE,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 8,
    minHeight: 148,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  cardSelected: {
    borderColor: Colors.accent,
    backgroundColor: '#1A1A3E',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.accentGlow,
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
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 7,
    textAlign: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  check: {
    position: 'absolute',
    top: 9,
    right: 9,
  },
});
