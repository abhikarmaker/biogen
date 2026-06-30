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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import IcebreakerCard from '../components/IcebreakerCard';
import { getIcebreakerHistory, deleteIcebreaker } from '../services/api';
import { useUser } from '../context/UserContext';
import { radii } from '../constants/radii';

export default function MyIcebreakers({ navigation }) {
  const { isPro, savedIcebreakers, removeIcebreaker } = useUser();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const savedRef = useRef(savedIcebreakers);
  useEffect(() => { savedRef.current = savedIcebreakers; }, [savedIcebreakers]);

  const [icebreakers, setIcebreakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIcebreakers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (isPro) {
        const data = await getIcebreakerHistory();
        const serverIds = new Set((data.icebreakers || []).map((i) => i.id));
        const localOnly = savedRef.current.filter((i) => !serverIds.has(i.id));
        setIcebreakers([...localOnly, ...(data.icebreakers || [])]);
      } else {
        setIcebreakers(savedRef.current);
      }
    } catch {
      setIcebreakers(savedRef.current);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isPro]);

  useEffect(() => { fetchIcebreakers(); }, [fetchIcebreakers]);

  const handleDelete = async (id) => {
    removeIcebreaker(id);
    setIcebreakers((prev) => prev.filter((i) => i.id !== id));
    try { await deleteIcebreaker(id); } catch { /* ok in dev */ }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={styles.centered} color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>My Icebreakers</Text>
          <Text style={styles.count}>{icebreakers.length} saved</Text>
        </View>
      </View>

      {!isPro && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Paywall')}
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
            <Text style={styles.upgradeBannerText}>Upgrade to Pro to save your icebreakers forever</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {icebreakers.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="chat-processing-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No icebreakers yet</Text>
          <Text style={styles.emptySub}>
            {isPro
              ? 'Generate your first opener and it\'ll be saved here forever'
              : 'Icebreakers you generate this session will appear here. Upgrade to Pro to keep them forever.'}
          </Text>
          <TouchableOpacity
            style={styles.generateBtn}
            onPress={() => navigation.navigate('Icebreaker')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.accent, colors.accentLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateBtnInner}
            >
              <Text style={styles.generateBtnText}>Generate openers</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={icebreakers}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <IcebreakerCard icebreaker={item} onDelete={handleDelete} showDelete />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={isPro ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchIcebreakers(true); }}
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
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 10,
    paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontWeight: '700', color: C.textPrimary, letterSpacing: -0.3 },
  count: { fontSize: 13, color: C.textMuted, marginTop: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  emptySub: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20 },
  generateBtn: { borderRadius: radii.md, overflow: 'hidden', marginTop: 4, width: '100%' },
  generateBtnInner: { paddingVertical: 15, alignItems: 'center', borderRadius: radii.md },
  generateBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  upgradeBanner: { marginHorizontal: 16, marginBottom: 8, borderRadius: radii.sm, overflow: 'hidden' },
  upgradeBannerInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, gap: 8 },
  upgradeBannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#fff' },
});
