import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Alert,
} from 'react-native';
import Colors from '../constants/colors';
import { generateBio } from '../services/api';
import { useUser } from '../context/UserContext';

function buildMockBio({ platform, role, interests, tone, length }) {
  const charLimits = { linkedin: 2600, instagram: 150, twitter: 160, hinge: 300, bumble: 300, tiktok: 80 };
  const limit = charLimits[platform] || 300;

  const interestList = interests
    .split(/[,.\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const first = interestList[0] || interests;
  const others = interestList.slice(1, 3).join(' and ');

  const templates = {
    linkedin: {
      Friendly: `${role} who genuinely loves what I do. Outside of work you'll find me ${first}${others ? ` and ${others}` : ''}. I believe the best work happens when people actually care — about the problem, the craft, and each other.`,
      Professional: `${role}. I bring focus and clarity to complex challenges. Passionate about ${first}${others ? ` and ${others}` : ''}. Open to connecting with people doing interesting work.`,
      Witty: `${role} by day — ${first} enthusiast by night. I take my work seriously but not myself.${others ? ` Also into ${others}.` : ''} Let's connect and build something worth talking about.`,
      Bold: `${role}. I don't do average. Driven by ${first}${others ? ` and ${others}` : ''}. If you're building something ambitious, let's talk.`,
      Minimal: `${role}. Into ${interestList.slice(0, 2).join(', ')}. Always learning.`,
    },
    instagram: {
      Friendly: `${role} ✨ Obsessed with ${first}${others ? ` + ${others}` : ''} 🌿`,
      Professional: `${role} | ${first}${others ? ` | ${others}` : ''}`,
      Witty: `${role} 🤙 ${first} fanatic${others ? ` & occasional ${others} person` : ''}`,
      Bold: `${role}. ${first.toUpperCase()}.${others ? ` Also ${others}.` : ''}`,
      Minimal: `${role} · ${first}`,
    },
    twitter: {
      Friendly: `${role}. Big fan of ${first}${others ? ` and ${others}` : ''}. Tweeting about things I find interesting.`,
      Professional: `${role} | Thoughts on ${first}${others ? ` & ${others}` : ''} | Views my own`,
      Witty: `${role}. Professionally into ${first}${others ? `, accidentally into ${others}` : ''}. Tweets are chaotic good.`,
      Bold: `${role}. ${first} obsessive.${others ? ` ${others} too.` : ''} Unfiltered takes daily.`,
      Minimal: `${role}. ${first}.`,
    },
    hinge: {
      Friendly: `${role} who also happens to love ${first}${others ? ` and ${others}` : ''}. I'm better in person than on paper — ask me anything.`,
      Professional: `${role} with a soft spot for ${first}.${others ? ` Also really into ${others}.` : ''} Looking for someone curious about the world.`,
      Witty: `${role} by day, ${first} enthusiast by night.${others ? ` Deeply committed to ${others} as well.` : ''} Fluent in sarcasm, terrible at goodbyes.`,
      Bold: `${role}. I'm into ${first}${others ? ` and ${others}` : ''}. I know what I want — do you?`,
      Minimal: `${role}. Love ${first}. Let's skip the small talk.`,
    },
    bumble: {
      Friendly: `${role} with a love for ${first}${others ? ` and ${others}` : ''}. I always have a restaurant recommendation ready. Let's find out if we vibe.`,
      Professional: `${role}. Passionate about ${first}${others ? ` and ${others}` : ''}. Looking for someone who matches my energy.`,
      Witty: `${role} who takes ${first} way too seriously.${others ? ` Also weirdly good at ${others}.` : ''} Swipe right if you can keep up.`,
      Bold: `${role}. ${first} is my love language.${others ? ` So is ${others}.` : ''} Make the first move worth it.`,
      Minimal: `${role}. ${first}. Good vibes only.`,
    },
    tiktok: {
      Friendly: `${role} | ${first} lover 🎉`,
      Professional: `${role} · ${first}`,
      Witty: `${role} obsessed with ${first} 😅`,
      Bold: `${role}. ${first}. No filter.`,
      Minimal: `${role} · ${first}`,
    },
  };

  const tpl = (templates[platform] || templates.instagram)[tone] || Object.values(templates[platform] || templates.instagram)[0];
  return tpl.length > limit ? tpl.slice(0, limit).trimEnd() : tpl;
}

async function mockGenerateBio(params) {
  await new Promise((r) => setTimeout(r, 2000));
  return {
    bio: {
      id: 'mock-' + Date.now(),
      platform: params.platform,
      content: buildMockBio(params),
      tone: params.tone,
      length: params.length,
      role: params.role,
      interests: params.interests,
      created_at: new Date().toISOString(),
    },
  };
}

export default function Loading({ navigation, route }) {
  const { platform, role, interests, tone, length } = route.params;
  const { incrementBioCount, addBio } = useUser();

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
      const params = { platform: platform.id, role, interests, tone, length };
      let result;

      try {
        result = await generateBio(params);
      } catch (err) {
        // Quota exceeded — don't fall back to mock, send user back with reset info
        if (err.code === 'FREE_LIMIT_REACHED' || err.message?.includes('limit reached')) {
          if (!cancelled) {
            let detail = 'Your quota resets in 12 hours.';
            if (err.resetsAt) {
              const diff = new Date(err.resetsAt) - Date.now();
              const h = Math.floor(diff / 3600000);
              const m = Math.floor((diff % 3600000) / 60000);
              detail = h > 0 ? `Your quota resets in ${h}h ${m}m.` : `Your quota resets in ${m}m.`;
            }
            navigation.goBack();
            Alert.alert('Limit reached', `${detail} Upgrade to Pro for unlimited bios.`);
          }
          return;
        }
        // Backend unavailable — use local mock
        result = await mockGenerateBio(params);
      }

      if (cancelled) return;

      addBio(result.bio);
      incrementBioCount();
      navigation.replace('Result', { bio: result.bio, platform });
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
        <Text style={styles.heading}>Writing your bio...</Text>
        <Text style={styles.sub}>Crafting something that actually sounds like you</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  dotRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.accent },
  heading: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', letterSpacing: -0.3, marginBottom: 10 },
  sub: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
