import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Linking,
  TextInput,
  Modal,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import ProBadge from '../components/ProBadge';
import { restoreNativePurchases, isEntitledPro } from '../services/purchases';
import { saveAvatarUri, getAvatarUri, saveDisplayName, getDisplayName } from '../services/storage';
import { format } from 'date-fns';
import { radii } from '../constants/radii';

function SettingRow({ icon, label, value, onPress, destructive, noBorder, colors }) {
  return (
    <TouchableOpacity
      style={[
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: noBorder ? 0 : 1, borderBottomColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={destructive ? colors.danger : colors.textSecondary}
        />
        <Text style={{ fontSize: 15, color: destructive ? colors.danger : colors.textPrimary }}>
          {label}
        </Text>
      </View>
      {value ? (
        <Text style={{ fontSize: 14, color: colors.textMuted }}>{value}</Text>
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

const THEME_OPTIONS = [
  { value: 'dark',   label: 'Dark',   icon: 'weather-night' },
  { value: 'light',  label: 'Light',  icon: 'weather-sunny' },
  { value: 'system', label: 'System', icon: 'theme-light-dark' },
];

export default function Account({ navigation }) {
  const { user, isPro, logout, refreshUser, upgradeToPro } = useUser();
  const { colors, theme, setTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [restoring, setRestoring] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const userId = user?.id;

  useEffect(() => {
    // Clear immediately so previous user's data never bleeds into the next session
    setAvatarUri(null);
    setDisplayName('');
    if (!userId) return;
    getAvatarUri(userId).then((uri) => setAvatarUri(uri || null));
    getDisplayName(userId).then((name) => setDisplayName(name || ''));
  }, [userId]);

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow access to your photos to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      if (userId) await saveAvatarUri(userId, uri);
    }
  };

  const openNameModal = () => {
    setNameInput(displayName);
    setNameModalVisible(true);
  };

  const saveNameModal = async () => {
    const trimmed = nameInput.trim();
    setDisplayName(trimmed);
    if (userId) await saveDisplayName(userId, trimmed);
    setNameModalVisible(false);
  };

  const handleLogout = () => {
    Alert.alert('Sign out?', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const customerInfo = await restoreNativePurchases();
      // Optimistic local flip for instant feedback — refreshUser() below picks
      // up the authoritative plan once the RevenueCat webhook has landed.
      if (isEntitledPro(customerInfo)) upgradeToPro();
      await refreshUser();
      Alert.alert('Done', 'Purchases restored successfully.');
    } catch {
      Alert.alert('No purchases found', 'No previous purchases found for this account.');
    } finally {
      setRestoring(false);
    }
  };

  const renewalDate = user?.subscription?.expires_at
    ? format(new Date(user.subscription.expires_at), 'MMMM d, yyyy')
    : null;

  const initials = (displayName || user?.email || '?')
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Account</Text>
        </View>

        {/* Profile section */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8} style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={[colors.accent, colors.accentLight]}
                style={styles.avatarPlaceholder}
              >
                <Text style={styles.avatarInitials}>{initials}</Text>
              </LinearGradient>
            )}
            <View style={[styles.avatarEditBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="camera" size={13} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <TouchableOpacity onPress={openNameModal} activeOpacity={0.7} style={styles.nameRow}>
              <Text style={styles.profileName} numberOfLines={1}>
                {displayName || 'Add your name'}
              </Text>
              <MaterialCommunityIcons name="pencil-outline" size={15} color={colors.textMuted} />
            </TouchableOpacity>
            <Text style={styles.profileEmail} numberOfLines={1}>{user?.email}</Text>
          </View>
        </View>

        {/* Plan card */}
        <View style={styles.planCard}>
          {isPro ? (
            <LinearGradient
              colors={[colors.accent, colors.accentLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.planGradient}
            >
              <View style={styles.planRow}>
                <View>
                  <Text style={styles.planStatus}>Pro Plan · Active</Text>
                  {renewalDate && <Text style={styles.planRenewal}>Renews {renewalDate}</Text>}
                </View>
                <ProBadge size="lg" />
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.planFree}>
              <View style={styles.planRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planStatusFree}>Free Plan</Text>
                  <Text style={styles.planUsage}>
                    {user?.bio_count || 0} of {user?.free_limit || 3} free bios used
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Generate', { screen: 'Paywall' })}
                  style={styles.upgradeChip}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[colors.proGold, colors.proGoldDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.upgradeChipInner}
                  >
                    <Text style={[styles.upgradeChipText, { color: colors.proText }]}>Upgrade</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Appearance */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Appearance</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt, i) => {
              const active = theme === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setTheme(opt.value)}
                  activeOpacity={0.75}
                  style={[
                    styles.themeBtn,
                    i === 0 && styles.themeBtnFirst,
                    i === THEME_OPTIONS.length - 1 && styles.themeBtnLast,
                    active && styles.themeBtnActive,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={opt.icon}
                    size={18}
                    color={active ? colors.accent : colors.textSecondary}
                  />
                  <Text style={[styles.themeBtnLabel, active && styles.themeBtnLabelActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Settings</Text>
        </View>
        <View style={styles.section}>
          <SettingRow
            icon="restore"
            label="Restore purchases"
            onPress={handleRestore}
            colors={colors}
          />
          {restoring && <ActivityIndicator color={colors.accent} style={{ marginLeft: 16, marginBottom: 4 }} />}
          <SettingRow
            icon="help-circle-outline"
            label="Contact support"
            onPress={() => Linking.openURL('mailto:support@biogen.app')}
            colors={colors}
          />
          <SettingRow
            icon="shield-outline"
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://biogen.app/privacy')}
            colors={colors}
          />
          <SettingRow
            icon="file-document-outline"
            label="Terms of Service"
            onPress={() => Linking.openURL('https://biogen.app/terms')}
            noBorder
            colors={colors}
          />
        </View>

        <View style={styles.section}>
          <SettingRow
            icon="logout"
            label="Sign out"
            onPress={handleLogout}
            destructive
            noBorder
            colors={colors}
          />
        </View>

        <Text style={styles.version}>BioGen v1.0.0</Text>
      </ScrollView>

      {/* Edit name modal */}
      <Modal
        visible={nameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Display name</Text>
            <TextInput
              style={styles.modalInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              autoFocus
              maxLength={40}
              returnKeyType="done"
              onSubmitEditing={saveNameModal}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setNameModalVisible(false)}
                style={[styles.modalBtn, styles.modalBtnCancel]}
              >
                <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveNameModal}
                style={[styles.modalBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: '700', color: C.textPrimary },

  // Profile section
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 26, fontWeight: '700', color: '#fff' },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  profileInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileName: { fontSize: 18, fontWeight: '700', color: C.textPrimary, flex: 1 },
  profileEmail: { fontSize: 13, color: C.textMuted },

  // Plan card
  planCard: {
    marginHorizontal: 16,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: 24,
  },
  planGradient: { padding: 18, borderRadius: radii.lg },
  planFree: {
    padding: 18,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: radii.lg,
  },
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planStatus: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2 },
  planStatusFree: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 2 },
  planRenewal: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  planUsage: { fontSize: 13, color: C.textMuted, marginTop: 4 },
  upgradeChip: { borderRadius: 10, overflow: 'hidden' },
  upgradeChipInner: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  upgradeChipText: { fontSize: 13, fontWeight: '700' },

  // Section headers
  sectionHeader: { paddingHorizontal: 20, paddingBottom: 6 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Sections
  section: {
    marginHorizontal: 16,
    backgroundColor: C.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
    overflow: 'hidden',
  },

  // Theme picker
  themeRow: { flexDirection: 'row' },
  themeBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 5,
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  themeBtnFirst: {},
  themeBtnLast: { borderRightWidth: 0 },
  themeBtnActive: { backgroundColor: C.accentGlow },
  themeBtnLabel: { fontSize: 12, fontWeight: '500', color: C.textSecondary },
  themeBtnLabelActive: { color: C.accent, fontWeight: '600' },

  version: {
    textAlign: 'center',
    fontSize: 12,
    color: C.textMuted,
    marginTop: 4,
    marginBottom: 24,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    width: '100%',
    backgroundColor: C.surface,
    borderRadius: radii.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: C.textPrimary, marginBottom: 16 },
  modalInput: {
    backgroundColor: C.background,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: C.textPrimary,
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  modalBtnCancel: { backgroundColor: C.background, borderWidth: 1, borderColor: C.border },
  modalBtnText: { fontSize: 15, fontWeight: '600' },
});
