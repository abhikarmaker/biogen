import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import ProBadge from '../components/ProBadge';
import { useUser } from '../context/UserContext';
import { restorePurchases } from '../services/api';
import { format } from 'date-fns';

function SettingRow({ icon, label, value, onPress, destructive, noBorder }) {
  return (
    <TouchableOpacity style={[styles.row, noBorder && { borderBottomWidth: 0 }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={destructive ? Colors.danger : Colors.textSecondary}
        />
        <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>
          {label}
        </Text>
      </View>
      {value ? (
        <Text style={styles.rowValue}>{value}</Text>
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

export default function Account({ navigation }) {
  const { user, isPro, logout, refreshUser } = useUser();
  const [restoring, setRestoring] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign out?', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await restorePurchases();
      await refreshUser();
      Alert.alert('Done', 'Purchases restored successfully.');
    } catch (err) {
      Alert.alert('No purchases found', 'No previous purchases found for this account.');
    } finally {
      setRestoring(false);
    }
  };

  const renewalDate = user?.subscription?.expires_at
    ? format(new Date(user.subscription.expires_at), 'MMMM d, yyyy')
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Account</Text>
      </View>

      {/* Plan card */}
      <View style={styles.planCard}>
        {isPro ? (
          <LinearGradient
            colors={[Colors.accent, Colors.accentLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.planGradient}
          >
            <View style={styles.planRow}>
              <View>
                <Text style={styles.planEmail}>{user?.email}</Text>
                <Text style={styles.planStatus}>Pro Plan · Active</Text>
                {renewalDate && (
                  <Text style={styles.planRenewal}>Renews {renewalDate}</Text>
                )}
              </View>
              <ProBadge size="lg" />
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.planFree}>
            <View style={styles.planRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planEmail}>{user?.email}</Text>
                <Text style={styles.planStatus}>Free Plan</Text>
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
                  colors={['#FFD700', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.upgradeChipInner}
                >
                  <Text style={styles.upgradeChipText}>Upgrade</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Settings rows */}
      <View style={styles.section}>
        <SettingRow
          icon="restore"
          label="Restore purchases"
          onPress={handleRestore}
        />
        {restoring && <ActivityIndicator color={Colors.accent} style={{ marginLeft: 16, marginBottom: 4 }} />}
        <SettingRow
          icon="help-circle-outline"
          label="Contact support"
          onPress={() => Linking.openURL('mailto:support@biogen.app')}
        />
        <SettingRow
          icon="shield-outline"
          label="Privacy Policy"
          onPress={() => Linking.openURL('https://biogen.app/privacy')}
        />
        <SettingRow
          icon="file-document-outline"
          label="Terms of Service"
          onPress={() => Linking.openURL('https://biogen.app/terms')}
          noBorder
        />
      </View>

      <View style={styles.section}>
        <SettingRow
          icon="logout"
          label="Sign out"
          onPress={handleLogout}
          destructive
          noBorder
        />
      </View>

      <Text style={styles.version}>BioGen v1.0.0</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  planCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  planGradient: { padding: 20, borderRadius: 16 },
  planFree: {
    padding: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
  },
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planEmail: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  planStatus: { fontSize: 17, fontWeight: '700', color: '#fff' },
  planRenewal: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3 },
  planUsage: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  upgradeChip: { borderRadius: 10, overflow: 'hidden' },
  upgradeChipInner: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  upgradeChipText: { fontSize: 13, fontWeight: '700', color: '#1A1000' },
  section: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 15, color: Colors.textPrimary },
  rowLabelDestructive: { color: Colors.danger },
  rowValue: { fontSize: 14, color: Colors.textMuted },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },
});
