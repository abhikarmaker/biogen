import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import Colors from '../constants/colors';
import BioCard from '../components/BioCard';
import { getBioHistory, deleteBio } from '../services/api';
import { useUser } from '../context/UserContext';

export default function MyBios({ navigation }) {
  const { isPro, savedBios, removeBio } = useUser();
  const savedBiosRef = useRef(savedBios);
  useEffect(() => { savedBiosRef.current = savedBios; }, [savedBios]);

  const [bios, setBios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBios = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getBioHistory();
      const supabaseIds = new Set((data.bios || []).map((b) => b.id));
      const localOnly = savedBiosRef.current.filter((b) => !supabaseIds.has(b.id));
      setBios([...localOnly, ...(data.bios || [])]);
    } catch {
      setBios(savedBiosRef.current);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBios(); }, [fetchBios]);

  const handleDelete = async (id) => {
    removeBio(id);
    setBios((prev) => prev.filter((b) => b.id !== id));
    try { await deleteBio(id); } catch { /* ok in dev */ }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bios</Text>
        <Text style={styles.count}>{bios.length} saved</Text>
      </View>

      {/* Upgrade banner for free users */}
      {!isPro && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Generate', { screen: 'Paywall' })}
          activeOpacity={0.85}
          style={styles.upgradeBanner}
        >
          <LinearGradient
            colors={[Colors.accent, Colors.accentLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.upgradeBannerInner}
          >
            <MaterialCommunityIcons name="star-circle" size={16} color="#fff" />
            <Text style={styles.upgradeBannerText}>Upgrade to Pro to save unlimited bios</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {bios.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="bookmark-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No bios yet</Text>
          <Text style={styles.emptySub}>Generate your first bio and it'll appear here</Text>
          <TouchableOpacity
            style={styles.generateBtn}
            onPress={() => navigation.navigate('Generate')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.accent, Colors.accentLight]}
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchBios(true); }}
              tintColor={Colors.accent}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  count: { fontSize: 14, color: Colors.textMuted },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  generateBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4, width: '100%' },
  generateBtnInner: { paddingVertical: 15, alignItems: 'center', borderRadius: 14 },
  generateBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  upgradeBanner: { marginHorizontal: 16, marginBottom: 8, borderRadius: 12, overflow: 'hidden' },
  upgradeBannerInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, gap: 8 },
  upgradeBannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#fff' },
});
