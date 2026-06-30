import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { generateIcebreakers } from '../services/api';
import { useUser } from '../context/UserContext';
import { getIcebreakerStreak, saveIcebreakerStreak } from '../services/storage';

function buildMockOpeners({ matchBio, tone, reference }) {
  const topic = (reference || matchBio.split(/[,.\n!?]+/).map((s) => s.trim()).filter(Boolean)[0] || 'your bio').slice(0, 80);
  const templates = {
    Playful: [
      `Okay I have to ask — what's the story behind "${topic}"? I have a feeling it's a good one.`,
      `"${topic}" just earned you a swipe right and a follow-up question. Explain yourself.`,
      `Plot twist: I'm now mildly obsessed with "${topic}". Tell me everything.`,
    ],
    Witty: [
      `"${topic}" — bold choice to put in a dating bio. I respect it. Tell me more.`,
      `I was going to open with something clever, but "${topic}" already did the work for me.`,
      `Unpopular opinion: anyone who mentions "${topic}" deserves a real conversation, not a "hey".`,
    ],
    Direct: [
      `"${topic}" caught my attention — what got you into that?`,
      `I don't usually message first, but "${topic}" changed my mind. What's the story there?`,
      `Skipping the small talk: tell me about "${topic}".`,
    ],
    Charming: [
      `There's something about "${topic}" that made me smile — I'd love to hear more about it.`,
      `Your mention of "${topic}" stood out to me. What drew you to it?`,
      `I have a feeling "${topic}" says a lot about you — care to elaborate?`,
    ],
    Curious: [
      `What's the story behind "${topic}"? I'm genuinely curious.`,
      `I want to know more about "${topic}" — how did that come about?`,
      `"${topic}" raised a few questions for me. Mind if I ask?`,
    ],
  };
  return (templates[tone] || templates.Playful).slice(0, 3);
}

async function nextStreak(uid) {
  const prev = await getIcebreakerStreak(uid);
  const today = new Date().toISOString().slice(0, 10);
  if (prev.lastDate === today) return prev.count || 0;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const count = prev.lastDate === yesterday ? (prev.count || 0) + 1 : 1;
  await saveIcebreakerStreak(uid, { count, lastDate: today });
  return count;
}

export default function IcebreakerLoading({ navigation, route }) {
  const { matchBio, tone, reference } = route.params;
  const { user, isPro, addIcebreaker } = useUser();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const dot1 = useRef(new Animated.Value(0.4)).current;
  const dot2 = useRef(new Animated.Value(0.4)).current;
  const dot3 = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.4, duration: 500, useNativeDriver: true }),
        ])
      );

    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 180);
    const a3 = pulse(dot3, 360);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      let icebreaker;

      try {
        const result = await generateIcebreakers({ matchBio, tone, reference });
        icebreaker = result.icebreaker;
      } catch (err) {
        const mock = buildMockOpeners({ matchBio, tone, reference });
        icebreaker = {
          id: 'mock-' + Date.now(),
          match_bio: matchBio,
          tone,
          reference: reference || null,
          openers: mock.map((text, i) => (i === 2 && !isPro ? { text: null, locked: true } : { text, locked: false })),
          created_at: new Date().toISOString(),
        };
      }

      if (cancelled) return;

      addIcebreaker(icebreaker);

      const streak = user?.id ? await nextStreak(user.id) : 0;
      if (cancelled) return;

      navigation.replace('IcebreakerResult', { openers: icebreaker.openers, matchBio, tone, streak });
    }

    generate().catch((err) => {
      if (cancelled) return;
      navigation.goBack();
      Alert.alert('Error', err.message || 'Something went wrong. Please try again.');
    });

    return () => { cancelled = true; };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <View style={styles.dotRow}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View
              key={i}
              style={[styles.dot, { opacity: dot, transform: [{ scale: dot }] }]}
            />
          ))}
        </View>
        <Text style={styles.heading}>Crafting your openers...</Text>
        <Text style={styles.sub}>Reading between the lines of their bio</Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  dotRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: C.accent },
  heading: { fontSize: 22, fontWeight: '700', color: C.textPrimary, textAlign: 'center', letterSpacing: -0.3, marginBottom: 10 },
  sub: { fontSize: 15, color: C.textSecondary, textAlign: 'center', lineHeight: 22 },
});
