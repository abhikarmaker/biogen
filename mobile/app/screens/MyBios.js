import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import BioCard from '../components/BioCard';
import { getBioHistory, deleteBio } from '../services/api';
import { useUser } from '../context/UserContext';

export default function MyBios({ navigation }) {
  const { isPro, savedBios, removeBio } = useUser();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const savedBiosRef = useRef(savedBios);
  useEffect(() => { savedBiosRef.current = savedBios; }, [savedBios]);

  const [bios, setBios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBios = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (isPro) {
        // Pro: merge server history with any in-session bios not yet synced
        const data = await getBioHistory();
        const supabaseIds = new Set((data.bios || []).map((b) => b.id));
        const localOnly = savedBiosRef.current.filter((b) => !supabaseIds.has(b.id));
        setBios([...localOnly, ...(data.bios || [])]);
      } else {
        // Free: show only bios from the current session (cleared on sign-out)
        setBios(savedBiosRef.current);
      }
    } catch {
      setBios(savedBiosRef.current);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isPro]);

  useEffect(() => { fetchBios(); }, [fetchBios]);

  const handleDelete = async (id) => {
    removeBio(id);
    setBios((prev) => prev.filter((b) => b.id !== id));
    try { await deleteBio(id); } catch { /* ok in dev */ }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bios</Text>
        <Text style={styles.count}>{bios.length} saved</Text>
      </View>

      {!isPro && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Generate', { screen: 'Paywall' })}
          activeOpacity={0.85}
          style={styles.upgradeBanner}
        >
          <LinearGradient
            colors={[colors.accent, colors.accentLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.upgradeBannerInner}
          >
            <MaterialCommunityIcons name="star-circle" size={16} color="#fff" />
            <Text style={styles.upgradeBannerText}>Upgrade to Pro to save your bios forever</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {bios.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="bookmark-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No bios yet</Text>
          <Text style={styles.emptySub}>
            {isPro
              ? 'Generate your first bio and it\'ll be saved here forever'
              : 'Bios you generate this session will appear here. Upgrade to Pro to keep them forever.'}
          </Text>
          <TouchableOpacity
            style={styles.generateBtn}
            onPress={() => navigation.navigate('Generate')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.accent, colors.accentLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateBtnInner}
            >
              <Text style={styles.generateBtnText}>Generate a bio</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bios}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => (
            <BioCard bio={item} onDelete={handleDelete} showDelete />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={isPro ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchBios(true); }}
              tintColor={colors.accent}
            />
          ) : undefined}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '700', color: C.textPrimary },
  count: { fontSize: 14, color: C.textMuted },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  emptySub: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20 },
  generateBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4, width: '100%' },
  generateBtnInner: { paddingVertical: 15, alignItems: 'center', borderRadius: 14 },
  generateBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  upgradeBanner: { marginHorizontal: 16, marginBottom: 8, borderRadius: 12, overflow: 'hidden' },
  upgradeBannerInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, gap: 8 },
  upgradeBannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#fff' },
});
