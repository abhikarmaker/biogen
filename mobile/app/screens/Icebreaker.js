import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import TonePill from '../components/TonePill';
import { getIcebreakerStreak } from '../services/storage';

const TONES = ['Playful', 'Witty', 'Direct', 'Charming', 'Curious'];
const MAX_BIO_LENGTH = 1000;

export default function Icebreaker({ navigation }) {
  const { user } = useUser();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [matchBio, setMatchBio] = useState('');
  const [tone, setTone] = useState('Playful');
  const [reference, setReference] = useState('');
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    getIcebreakerStreak(user.id).then((s) => setStreak(s.count || 0));
  }, [user?.id]);

  const canGenerate = matchBio.trim().length > 0;

  const handleGenerate = () => {
    if (!canGenerate) return;
    navigation.navigate('IcebreakerLoading', {
      matchBio: matchBio.trim(),
      tone,
      reference: reference.trim(),
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image source={require('../../assets/icon.png')} style={styles.logoMark} />
            <Text style={styles.logoText}>Icebreakers</Text>
            {streak > 0 && (
              <View style={styles.streakPill}>
                <MaterialCommunityIcons name="fire" size={13} color={colors.warning} />
                <Text style={styles.streakText}>{streak} day streak</Text>
              </View>
            )}
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={() => navigation.navigate('MyIcebreakers')}
              hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
            >
              <MaterialCommunityIcons name="bookmark-multiple-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>Never open with "hey"</Text>
          <Text style={styles.subtitle}>Paste their bio, pick a vibe, get 3 openers</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={styles.label}>Their bio</Text>
            <TextInput
              style={styles.bioInput}
              placeholder="Paste their dating app bio here..."
              placeholderTextColor={colors.textMuted}
              value={matchBio}
              onChangeText={setMatchBio}
              multiline
              maxLength={MAX_BIO_LENGTH}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{matchBio.length}/{MAX_BIO_LENGTH}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tone</Text>
            <View style={styles.pills}>
              {TONES.map((t) => (
                <TonePill key={t} label={t} isSelected={tone === t} onPress={() => setTone(t)} />
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Something to reference (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. their trip to Japan, their dog..."
              placeholderTextColor={colors.textMuted}
              value={reference}
              onChangeText={setReference}
              maxLength={120}
            />
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={!canGenerate}
            activeOpacity={0.85}
            style={styles.generateOuter}
          >
            {canGenerate ? (
              <LinearGradient
                colors={[colors.accent, colors.accentLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.generateBtn}
              >
                <Text style={styles.generateText}>Generate openers</Text>
                <Ionicons name="sparkles" size={18} color="#fff" />
              </LinearGradient>
            ) : (
              <View style={[styles.generateBtn, styles.generateDisabled]}>
                <Text style={[styles.generateText, { color: colors.textMuted }]}>
                  Paste their bio first
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    marginLeft: 2,
  },
  streakText: { fontSize: 11, fontWeight: '700', color: C.warning },
  title: { fontSize: 26, fontWeight: '700', color: C.textPrimary, letterSpacing: -0.4, marginBottom: 6 },
  subtitle: { fontSize: 15, color: C.textSecondary, lineHeight: 22 },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  field: { marginBottom: 22 },
  label: { fontSize: 14, fontWeight: '600', color: C.textSecondary, marginBottom: 8, letterSpacing: 0.2 },
  bioInput: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: C.textPrimary,
    minHeight: 120,
  },
  charCount: { fontSize: 11, color: C.textMuted, textAlign: 'right', marginTop: 4 },
  input: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: C.textPrimary,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap' },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 16 : 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  generateOuter: { borderRadius: 14, overflow: 'hidden' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 17, gap: 8 },
  generateDisabled: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14 },
  generateText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
});
