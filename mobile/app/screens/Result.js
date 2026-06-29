import React, { useState } from 'react';
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
import Colors from '../constants/colors';
import ProBadge from '../components/ProBadge';
import { useUser } from '../context/UserContext';

export default function Result({ navigation, route }) {
  const { bio, platform } = route.params;
  const { isPro } = useUser();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(bio.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const handleRegenerate = () => {
    if (!isPro) {
      navigation.navigate('Paywall', { fromRegenerate: true });
      return;
    }
    navigation.navigate('Loading', {
      platform,
      role: bio.role,
      interests: bio.interests,
      tone: bio.tone,
      length: bio.length,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('PlatformPicker')}
          style={styles.backBtn}
          hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
        >
          <Ionicons name="close" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your {platform.name} bio</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Bio card */}
        <View style={styles.bioCard}>
          <LinearGradient
            colors={platform.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bioCardAccent}
          />
          <Text style={styles.bioText}>{bio.content}</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {/* Copy */}
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.8}>
            <MaterialCommunityIcons
              name={copied ? 'check' : 'content-copy'}
              size={20}
              color={copied ? Colors.success : Colors.textPrimary}
            />
            <Text style={[styles.copyText, copied && { color: Colors.success }]}>
              {copied ? 'Copied!' : 'Copy bio'}
            </Text>
          </TouchableOpacity>

          {/* Regenerate */}
          <TouchableOpacity
            style={[styles.regenBtn, !isPro && styles.regenLocked]}
            onPress={handleRegenerate}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={20}
              color={isPro ? Colors.accentLight : Colors.textMuted}
            />
            <Text style={[styles.regenText, !isPro && styles.regenTextLocked]}>
              Regenerate
            </Text>
            {!isPro && <ProBadge />}
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Generate another */}
        <TouchableOpacity
          onPress={() => navigation.navigate('PlatformPicker')}
          activeOpacity={0.85}
          style={styles.generateOuter}
        >
          <LinearGradient
            colors={[Colors.accent, Colors.accentLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateBtn}
          >
            <Text style={styles.generateText}>Generate another bio</Text>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Unlock unlimited */}
        {!isPro && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Paywall')}
            activeOpacity={0.85}
            style={styles.upgradeBtn}
          >
            <MaterialCommunityIcons name="star-circle" size={18} color={Colors.warning} />
            <Text style={styles.upgradeText}>Unlock unlimited</Text>
            <ProBadge size="sm" />
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  bioCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  bioCardAccent: {
    height: 4,
    width: '100%',
  },
  bioText: {
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 26,
    padding: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  copyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  regenBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderSelected,
  },
  regenLocked: {
    borderColor: Colors.border,
    opacity: 0.7,
  },
  regenText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accentLight,
  },
  regenTextLocked: {
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 24,
  },
  generateOuter: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: 8,
  },
  generateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.warning,
    backgroundColor: 'rgba(251, 191, 36, 0.07)',
  },
  upgradeText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.warning,
  },
});
