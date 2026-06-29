import React, { useState, useEffect } from 'react';
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
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import Colors from '../constants/colors';
import { login, register, loginWithGoogle, loginWithApple } from '../services/auth';
import { useUser } from '../context/UserContext';

WebBrowser.maybeCompleteAuthSession();

const DEMO_EMAIL = 'demo@biogen.app';
const DEMO_PASS = 'demo123';

export default function Auth() {
  const { login: setUser } = useUser();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null); // 'google' | 'apple' | null
  const [showPass, setShowPass] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const accessToken = googleResponse.authentication?.accessToken;
      if (accessToken) {
        handleGoogleToken(accessToken);
      }
    } else if (googleResponse?.type === 'error') {
      setOauthLoading(null);
      Alert.alert('Error', 'Google sign-in failed. Please try again.');
    } else if (googleResponse?.type === 'dismiss') {
      setOauthLoading(null);
    }
  }, [googleResponse]);

  const handleGoogleToken = async (accessToken) => {
    setOauthLoading('google');
    try {
      const user = await loginWithGoogle(accessToken);
      setUser(user);
    } catch (err) {
      Alert.alert('Error', err.message || 'Google sign-in failed.');
    } finally {
      setOauthLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID) {
      Alert.alert('Not configured', 'Google sign-in is not set up yet. Use email & password for now.');
      return;
    }
    setOauthLoading('google');
    await promptGoogleAsync();
  };

  const handleAppleSignIn = async () => {
    setOauthLoading('apple');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const user = await loginWithApple(
        credential.identityToken,
        credential.email,
        credential.fullName,
      );
      setUser(user);
    } catch (err) {
      if (err.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Error', err.message || 'Apple sign-in failed.');
      }
    } finally {
      setOauthLoading(null);
    }
  };

  const fillDemo = () => {
    setShowEmailForm(true);
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

  const anyLoading = loading || oauthLoading !== null;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoSection}>
            <Image source={require('../../assets/icon.png')} style={styles.logoMark} />
            <Text style={styles.logoText}>BioGen</Text>
            <Text style={styles.tagline}>AI-powered bios for every platform</Text>
          </View>

          {/* OAuth buttons */}
          <View style={styles.oauthSection}>
            <TouchableOpacity
              style={styles.oauthBtn}
              onPress={handleGoogleSignIn}
              disabled={anyLoading}
              activeOpacity={0.8}
            >
              {oauthLoading === 'google' ? (
                <ActivityIndicator size="small" color={Colors.textPrimary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="google" size={20} color="#EA4335" />
                  <Text style={styles.oauthText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={12}
                style={styles.appleBtn}
                onPress={anyLoading ? undefined : handleAppleSignIn}
              />
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email form */}
          {!showEmailForm ? (
            <TouchableOpacity
              style={styles.emailToggleBtn}
              onPress={() => setShowEmailForm(true)}
              activeOpacity={0.8}
              disabled={anyLoading}
            >
              <MaterialCommunityIcons name="email-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.emailToggleText}>Use email & password</Text>
            </TouchableOpacity>
          ) : (
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
                editable={!anyLoading}
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
                  editable={!anyLoading}
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
                disabled={!isValid || anyLoading}
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
                disabled={anyLoading}
              >
                <Text style={styles.switchText}>
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <Text style={styles.switchAction}>
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={fillDemo} style={styles.demoBtn} activeOpacity={0.7} disabled={anyLoading}>
            <Text style={styles.demoText}>Use demo account</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingVertical: 32 },

  // Logo
  logoSection: { alignItems: 'center', marginBottom: 44 },
  logoMark: { width: 72, height: 72, borderRadius: 20, marginBottom: 14 },
  logoText: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: Colors.textSecondary, marginTop: 6 },

  // OAuth
  oauthSection: { gap: 12, marginBottom: 4 },
  oauthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 15,
    paddingHorizontal: 20,
    minHeight: 52,
  },
  oauthText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  appleBtn: { width: '100%', height: 52 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 13, color: Colors.textMuted, flexShrink: 0 },

  // Email toggle
  emailToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 15,
  },
  emailToggleText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },

  // Email form
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
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  submitOuter: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  submitBtn: { paddingVertical: 17, alignItems: 'center', borderRadius: 14 },
  submitDisabled: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  switchMode: { paddingVertical: 8, alignItems: 'center' },
  switchText: { fontSize: 14, color: Colors.textSecondary },
  switchAction: { color: Colors.accent, fontWeight: '600' },

  // Demo
  demoBtn: { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  demoText: { fontSize: 13, color: Colors.textMuted },
});
