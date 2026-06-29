import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import ProBadge from '../components/ProBadge';
import { createSubscription, createOneTimePayment } from '../services/api';
import { useUser } from '../context/UserContext';

const FEATURES = [
  'Unlimited bios across all platforms',
  'Regenerate with one tap',
  'More tone and style options',
  'Save and manage all your bios',
  'Priority generation speed',
];

export default function Paywall({ navigation }) {
  const { user, refreshUser, upgradeToPro } = useUser();
  const [loadingSub, setLoadingSub] = useState(false);
  const [loadingOne, setLoadingOne] = useState(false);

  const handleSubscribe = async () => {
    setLoadingSub(true);
    try {
      await createSubscription({ plan: 'monthly' });
      await refreshUser();
      navigation.goBack();
    } catch (err) {
      if (err.message?.includes('not configured')) {
        Alert.alert('Coming soon', 'Payments are not set up yet. Check back soon!');
      } else {
        Alert.alert('Payment failed', err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoadingSub(false);
    }
  };

  const handleOneTime = async () => {
    setLoadingOne(true);
    try {
      await createOneTimePayment({ product: 'lifetime' });
      await refreshUser();
      navigation.goBack();
    } catch (err) {
      if (err.message?.includes('not configured')) {
        Alert.alert('Coming soon', 'Payments are not set up yet. Check back soon!');
      } else {
        Alert.alert('Payment failed', err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoadingOne(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Close */}
      <TouchableOpacity
        style={styles.close}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
      >
        <Ionicons name="close" size={22} color={Colors.textSecondary} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient
          colors={['rgba(123,97,255,0.18)', 'transparent']}
          style={styles.hero}
        >
          <LinearGradient
            colors={[Colors.accent, Colors.accentLight]}
            style={styles.starWrap}
          >
            <MaterialCommunityIcons name="star-circle" size={32} color="#fff" />
          </LinearGradient>
          <ProBadge size="lg" />
          <Text style={styles.heroTitle}>Unlimited bios, zero limits</Text>
          <Text style={styles.heroSub}>
            Generate as many bios as you want across every platform
          </Text>
        </LinearGradient>

        {/* Features */}
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name="check" size={14} color={Colors.accent} />
              </View>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Price block */}
        <View style={styles.priceBlock}>
          <Text style={styles.price}>$4.99</Text>
          <Text style={styles.pricePer}>/month</Text>
        </View>
        <Text style={styles.trialNote}>3-day free trial · Cancel anytime</Text>

        {/* Primary CTA */}
        <TouchableOpacity
          onPress={handleSubscribe}
          disabled={loadingSub}
          activeOpacity={0.85}
          style={styles.primaryOuter}
        >
          <LinearGradient
            colors={[Colors.accent, Colors.accentLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtn}
          >
            {loadingSub ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Start free 3-day trial</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Secondary CTA */}
        <TouchableOpacity
          onPress={handleOneTime}
          disabled={loadingOne}
          activeOpacity={0.85}
          style={styles.secondaryBtn}
        >
          {loadingOne ? (
            <ActivityIndicator color={Colors.textSecondary} />
          ) : (
            <>
              <Text style={styles.secondaryText}>One-time unlock</Text>
              <Text style={styles.secondaryPrice}> — $9.99 forever</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.fine}>
          Cancel anytime before trial ends. No charge during trial.
        </Text>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  close: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 16 : 56,
    right: 20,
    zIndex: 10,
    padding: 4,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 60 },
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    borderRadius: 20,
    marginBottom: 28,
    gap: 10,
  },
  starWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  heroSub: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  features: {
    gap: 12,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
  priceBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 4,
  },
  price: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  pricePer: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  trialNote: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryOuter: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
  },
  primaryText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  secondaryPrice: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  fine: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
