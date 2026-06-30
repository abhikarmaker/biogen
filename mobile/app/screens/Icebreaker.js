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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import TonePill from '../components/TonePill';
import { getIcebreakerStreak } from '../services/storage';
import { extractBioFromImages } from '../services/api';
import { radii } from '../constants/radii';

const TONES = ['Playful', 'Witty', 'Direct', 'Charming', 'Curious'];
const MAX_BIO_LENGTH = 1000;
const MAX_SCREENSHOTS = 5;

export default function Icebreaker({ navigation }) {
  const { user } = useUser();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [matchBio, setMatchBio] = useState('');
  const [tone, setTone] = useState('Playful');
  const [reference, setReference] = useState('');
  const [streak, setStreak] = useState(0);
  const [screenshots, setScreenshots] = useState([]);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    getIcebreakerStreak(user.id).then((s) => setStreak(s.count || 0));
  }, [user?.id]);

  const canGenerate = matchBio.trim().length > 0;

  const pickScreenshots = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow access to your photos to upload a screenshot.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_SCREENSHOTS,
      quality: 0.6,
      base64: true,
    });
    if (result.canceled || !result.assets?.length) return;

    const picked = result.assets
      .filter((a) => a.base64)
      .slice(0, MAX_SCREENSHOTS)
      .map((a) => ({ uri: a.uri, base64: a.base64, mimeType: a.mimeType || 'image/jpeg' }));

    if (!picked.length) return;
    setScreenshots(picked);
    runExtraction(picked);
  };

  const removeScreenshot = (uri) => {
    setScreenshots((prev) => prev.filter((s) => s.uri !== uri));
  };

  const runExtraction = async (picked) => {
    setExtracting(true);
    try {
      const { bio } = await extractBioFromImages(
        picked.map(({ base64, mimeType }) => ({ base64, mimeType }))
      );
      if (!bio) {
        Alert.alert("Couldn't read that", 'No bio text was found in those screenshots. Try clearer images or paste it manually.');
        return;
      }
      if (matchBio.trim()) {
        Alert.alert(
          'Replace bio text?',
          "You've already got text in the bio field. Replace it with the text from these screenshots?",
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Replace', onPress: () => setMatchBio(bio) },
          ]
        );
      } else {
        setMatchBio(bio);
      }
    } catch (err) {
      Alert.alert('Error', err.message || "Couldn't read those screenshots. Try again or paste the bio manually.");
    } finally {
      setExtracting(false);
    }
  };

  const handleGenerate = () => {
    if (!canGenerate) return;
    navigation.navigate('IcebreakerLoading', {
      matchBio: matchBio.trim(),
      tone,
      reference: reference.trim(),
    });
    setMatchBio('');
    setReference('');
    setScreenshots([]);
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

            <TouchableOpacity
              onPress={pickScreenshots}
              disabled={extracting}
              style={styles.uploadLink}
              activeOpacity={0.7}
            >
              {extracting ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <MaterialCommunityIcons name="image-multiple-outline" size={16} color={colors.accent} />
              )}
              <Text style={styles.uploadLinkText}>
                {extracting ? 'Reading screenshots...' : "Can't copy the bio? Upload screenshot(s) instead"}
              </Text>
            </TouchableOpacity>

            {screenshots.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
                {screenshots.map((s) => (
                  <View key={s.uri} style={styles.thumbWrap}>
                    <Image source={{ uri: s.uri }} style={styles.thumb} />
                    <TouchableOpacity
                      onPress={() => removeScreenshot(s.uri)}
                      style={styles.thumbRemove}
                      hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
                    >
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
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
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: C.textPrimary,
    minHeight: 120,
  },
  charCount: { fontSize: 11, color: C.textMuted, textAlign: 'right', marginTop: 4 },
  uploadLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  uploadLinkText: { fontSize: 13, fontWeight: '600', color: C.accent },
  thumbRow: { marginTop: 10 },
  thumbWrap: { marginRight: 8, position: 'relative' },
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: C.surface },
  thumbRemove: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: C.surface,
    borderRadius: radii.sm,
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
  generateOuter: { borderRadius: radii.md, overflow: 'hidden' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 17, gap: 8 },
  generateDisabled: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: radii.md },
  generateText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
});
