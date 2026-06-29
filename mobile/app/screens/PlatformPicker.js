import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import PlatformCard from '../components/PlatformCard';
import { PLATFORMS } from '../constants/platforms';

const FREE_LIMIT = 3;

function formatCountdown(resetAt) {
  if (!resetAt) return null;
  const diff = resetAt - Date.now();
  if (diff <= 0) return 'soon';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function BioCounter({ used, limit, quotaResetsAt, colors }) {
  const [countdown, setCountdown] = useState(() => formatCountdown(quotaResetsAt));

  useEffect(() => {
    if (!quotaResetsAt) return;
    const id = setInterval(() => setCountdown(formatCountdown(quotaResetsAt)), 30000);
    return () => clearInterval(id);
  }, [quotaResetsAt]);

  return (
    <View style={counterStyles(colors).row}>
      <View style={counterStyles(colors).dots}>
        {Array.from({ length: limit }).map((_, i) => (
          <View
            key={i}
            style={[
              counterStyles(colors).dot,
              i < used ? counterStyles(colors).dotFilled : counterStyles(colors).dotEmpty,
            ]}
          />
        ))}
      </View>
      <Text style={counterStyles(colors).text}>
        {used >= limit && countdown
          ? `Resets in ${countdown}`
          : `${used} of ${limit} free bios used`}
      </Text>
    </View>
  );
}

const counterStyles = (C) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, gap: 10 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotFilled: { backgroundColor: C.accent },
  dotEmpty: { backgroundColor: C.border },
  text: { fontSize: 13, color: C.textSecondary },
});

export default function PlatformPicker({ navigation }) {
  const [selected, setSelected] = useState(null);
  const { user, isPro, biosUsed, freeLimit, canGenerate, quotaResetsAt } = useUser();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleContinue = () => {
    if (!selected) return;
    if (!canGenerate) {
      navigation.navigate('Paywall', { fromLimit: true });
      return;
    }
    navigation.navigate('AboutYou', { platform: selected });
  };

  const renderItem = ({ item, index }) => {
    const isRightColumn = index % 2 !== 0;
    return (
      <View style={[styles.cardWrapper, isRightColumn && styles.cardRight]}>
        <PlatformCard
          platform={item}
          isSelected={selected?.id === item.id}
          onPress={() => setSelected(item)}
        />
      </View>
    );
  };

  const ctaLabel = !selected
    ? 'Select a platform to continue'
    : canGenerate
    ? `Continue with ${selected.name}`
    : 'Upgrade to generate more bios';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image source={require('../../assets/icon.png')} style={styles.logoMark} />
          <Text style={styles.logoText}>BioGen</Text>
          {isPro && (
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.proBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.proBadgeText}>PRO</Text>
            </LinearGradient>
          )}
        </View>
        <Text style={styles.title}>Choose your platform</Text>
        <Text style={styles.subtitle}>We'll craft a bio that fits perfectly</Text>
      </View>

      <FlatList
        data={PLATFORMS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
      />

      <View style={styles.bottomBar}>
        {!isPro && (
          <BioCounter
            used={biosUsed}
            limit={freeLimit || FREE_LIMIT}
            quotaResetsAt={quotaResetsAt}
            colors={colors}
          />
        )}

        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selected}
          activeOpacity={0.85}
          style={styles.ctaOuter}
        >
          {selected && canGenerate ? (
            <LinearGradient
              colors={[colors.accent, colors.accentLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>{ctaLabel}</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={styles.ctaIcon} />
            </LinearGradient>
          ) : selected && !canGenerate ? (
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cta}
            >
              <MaterialCommunityIcons name="star-circle" size={18} color="#1A1000" style={styles.ctaIcon} />
              <Text style={[styles.ctaText, { color: '#1A1000' }]}>{ctaLabel}</Text>
            </LinearGradient>
          ) : (
            <View style={styles.ctaDisabled}>
              <Text style={styles.ctaTextDisabled}>{ctaLabel}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 12,
    paddingBottom: 8,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 8 },
  logoMark: { width: 28, height: 28, borderRadius: 8 },
  logoText: { fontSize: 18, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.3 },
  proBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginLeft: 2 },
  proBadgeText: { fontSize: 9, fontWeight: '800', color: '#1A1000', letterSpacing: 0.8 },
  title: { fontSize: 26, fontWeight: '700', color: C.textPrimary, letterSpacing: -0.4, marginBottom: 6 },
  subtitle: { fontSize: 15, color: C.textSecondary, lineHeight: 22 },
  grid: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  row: { justifyContent: 'space-between' },
  cardWrapper: { flex: 1, marginRight: 4 },
  cardRight: { marginRight: 0, marginLeft: 4 },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 16 : 10,
    backgroundColor: C.background,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  ctaOuter: { borderRadius: 14, overflow: 'hidden' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    paddingHorizontal: 24,
    gap: 8,
  },
  ctaDisabled: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    paddingHorizontal: 24,
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.2 },
  ctaTextDisabled: { fontSize: 15, fontWeight: '500', color: C.textMuted },
  ctaIcon: { marginLeft: 2 },
});
