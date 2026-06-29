import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import TonePill from '../components/TonePill';
import Colors from '../constants/colors';

const TONES = ['Friendly', 'Professional', 'Witty', 'Bold', 'Minimal'];
const LENGTHS = ['Short', 'Medium', 'Long'];

export default function AboutYou({ navigation, route }) {
  const { platform } = route.params;

  const [role, setRole] = useState('');
  const [interests, setInterests] = useState('');
  const [tone, setTone] = useState('Friendly');
  const [length, setLength] = useState('Medium');

  const canGenerate = role.trim().length > 0 && interests.trim().length > 0;

  const handleGenerate = () => {
    if (!canGenerate) return;
    navigation.navigate('Loading', { platform, role, interests, tone, length });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Tell us about you</Text>
            <Text style={styles.subtitle}>For your {platform.name} bio</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* What do you do */}
          <View style={styles.field}>
            <Text style={styles.label}>What do you do?</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Product designer at a startup"
              placeholderTextColor={Colors.textMuted}
              value={role}
              onChangeText={setRole}
              returnKeyType="next"
              maxLength={120}
            />
          </View>

          {/* Interests */}
          <View style={styles.field}>
            <Text style={styles.label}>Things you love or are proud of</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="e.g. Hiking, building side projects, obsessed with specialty coffee"
              placeholderTextColor={Colors.textMuted}
              value={interests}
              onChangeText={setInterests}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={300}
            />
            <Text style={styles.charCount}>{interests.length}/300</Text>
          </View>

          {/* Tone */}
          <View style={styles.field}>
            <Text style={styles.label}>Tone</Text>
            <View style={styles.pills}>
              {TONES.map((t) => (
                <TonePill
                  key={t}
                  label={t}
                  isSelected={tone === t}
                  onPress={() => setTone(t)}
                />
              ))}
            </View>
          </View>

          {/* Length */}
          <View style={styles.field}>
            <Text style={styles.label}>Length</Text>
            <View style={styles.pills}>
              {LENGTHS.map((l) => (
                <TonePill
                  key={l}
                  label={l}
                  isSelected={length === l}
                  onPress={() => setLength(l)}
                />
              ))}
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Generate button */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={!canGenerate}
            activeOpacity={0.85}
            style={styles.generateOuter}
          >
            {canGenerate ? (
              <LinearGradient
                colors={[Colors.accent, Colors.accentLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.generateBtn}
              >
                <Text style={styles.generateText}>Generate my bio</Text>
                <Ionicons name="sparkles" size={18} color="#fff" />
              </LinearGradient>
            ) : (
              <View style={[styles.generateBtn, styles.generateDisabled]}>
                <Text style={[styles.generateText, { color: Colors.textMuted }]}>
                  Fill in both fields to continue
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  field: {
    marginBottom: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  multiline: {
    minHeight: 100,
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 16 : 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  generateOuter: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: 8,
  },
  generateDisabled: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
  },
  generateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
});
