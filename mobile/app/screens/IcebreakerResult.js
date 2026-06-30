import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import ProBadge from '../components/ProBadge';
import { useUser } from '../context/UserContext';
import { radii } from '../constants/radii';

function OpenerCard({ opener, index, colors, styles }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(opener.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  if (opener.locked) {
    return (
      <View style={[styles.card, styles.cardLocked]}>
        <View style={styles.lockedFill}>
          <MaterialCommunityIcons name="lock" size={20} color={colors.textMuted} />
          <Text style={styles.lockedLabel}>3rd opener locked</Text>
          <ProBadge size="sm" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardIndex}>Opener {index + 1}</Text>
      <Text style={styles.cardText}>{opener.text}</Text>
      <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.8}>
        <MaterialCommunityIcons
          name={copied ? 'check' : 'content-copy'}
          size={17}
          color={copied ? colors.success : colors.accentLight}
        />
        <Text style={[styles.copyText, copied && { color: colors.success }]}>
          {copied ? 'Copied!' : 'Copy'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function IcebreakerResult({ navigation, route }) {
  const { openers, streak } = route.params;
  const { isPro } = useUser();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Icebreaker')}
          style={styles.backBtn}
          hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
        >
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your openers</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {streak > 0 && (
          <View style={styles.streakBanner}>
            <MaterialCommunityIcons name="fire" size={16} color={colors.warning} />
            <Text style={styles.streakBannerText}>{streak} day icebreaker streak — keep it going</Text>
          </View>
        )}

        {openers.map((opener, i) => (
          <OpenerCard key={i} opener={opener} index={i} colors={colors} styles={styles} />
        ))}

        <TouchableOpacity
          onPress={() => navigation.navigate('Icebreaker')}
          activeOpacity={0.85}
          style={styles.generateOuter}
        >
          <LinearGradient
            colors={[colors.accent, colors.accentLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateBtn}
          >
            <Text style={styles.generateText}>Try another bio</Text>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {!isPro && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Paywall')}
            activeOpacity={0.85}
            style={styles.upgradeBtn}
          >
            <MaterialCommunityIcons name="star-circle" size={18} color={colors.warning} />
            <Text style={styles.upgradeText}>Unlock all 3 openers</Text>
            <ProBadge size="sm" />
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    marginBottom: 18,
  },
  streakBannerText: { fontSize: 13, fontWeight: '600', color: C.warning },
  card: {
    backgroundColor: C.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 14,
  },
  cardLocked: { paddingVertical: 26 },
  lockedFill: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  lockedLabel: { fontSize: 14, fontWeight: '600', color: C.textMuted },
  cardIndex: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 },
  cardText: { fontSize: 15, color: C.textPrimary, lineHeight: 23, marginBottom: 12 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  copyText: { fontSize: 13, fontWeight: '600', color: C.accentLight },
  generateOuter: { borderRadius: radii.md, overflow: 'hidden', marginBottom: 12, marginTop: 6 },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 17, gap: 8 },
  generateText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: C.warning,
    backgroundColor: 'rgba(251, 191, 36, 0.07)',
  },
  upgradeText: { fontSize: 15, fontWeight: '600', color: C.warning },
});
