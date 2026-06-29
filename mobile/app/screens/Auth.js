import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { login, register } from '../services/auth';
import { useUser } from '../context/UserContext';

const DEMO_EMAIL = 'demo@biogen.app';
const DEMO_PASS = 'demo123';

export default function Auth() {
  const { login: setUser } = useUser();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASS);
  };

  const isValid = email.includes('@') && password.length >= 6;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const user = mode === 'login'
        ? await login(email, password)
        : await register(email, password);
      setUser(user);
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <LinearGradient
              colors={[Colors.accent, Colors.accentLight]}
              style={styles.logoMark}
            >
              <MaterialCommunityIcons name="lightning-bolt" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.logoText}>BioGen</Text>
            <Text style={styles.tagline}>AI-powered bios for every platform</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
            <View style={styles.passWrap}>
              <TextInput
                style={[styles.input, styles.passInput]}
                placeholder="Password (6+ characters)"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPass(!showPass)}
              >
                <MaterialCommunityIcons
                  name={showPass ? 'eye-off' : 'eye'}
                  size={20}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!isValid || loading}
              activeOpacity={0.85}
              style={styles.submitOuter}
            >
              {isValid ? (
                <LinearGradient
                  colors={[Colors.accent, Colors.accentLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtn}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>
                      {mode === 'login' ? 'Sign in' : 'Create account'}
                    </Text>
                  )}
                </LinearGradient>
              ) : (
                <View style={[styles.submitBtn, styles.submitDisabled]}>
                  <Text style={[styles.submitText, { color: Colors.textMuted }]}>
                    {mode === 'login' ? 'Sign in' : 'Create account'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
              style={styles.switchMode}
            >
              <Text style={styles.switchText}>
                {mode === 'login'
                  ? "Don't have an account? "
                  : 'Already have an account? '}
                <Text style={styles.switchAction}>
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={fillDemo} style={styles.demoBtn} activeOpacity={0.7}>
              <Text style={styles.demoText}>Use demo account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  logoSection: { alignItems: 'center', marginBottom: 48 },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: Colors.textSecondary, marginTop: 6 },
  form: { gap: 12 },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  passWrap: { position: 'relative' },
  passInput: { paddingRight: 48 },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  submitOuter: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  submitBtn: { paddingVertical: 17, alignItems: 'center', borderRadius: 14 },
  submitDisabled: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  switchMode: { paddingVertical: 8, alignItems: 'center' },
  switchText: { fontSize: 14, color: Colors.textSecondary },
  switchAction: { color: Colors.accent, fontWeight: '600' },
  demoBtn: { paddingVertical: 10, alignItems: 'center' },
  demoText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  demoCreds: { color: Colors.accentLight },
});
