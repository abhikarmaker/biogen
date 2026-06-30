import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../context/ThemeContext';

export default function IcebreakerCard({ icebreaker, onDelete, showDelete = false }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [expanded, setExpanded] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = async (text, index) => {
    await Clipboard.setStringAsync(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDelete = () => {
    Alert.alert('Delete this generation?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(icebreaker.id) },
    ]);
  };

  const matchBio = icebreaker.match_bio || icebreaker.matchBio || '';
  const preview = matchBio.slice(0, 90) + (matchBio.length > 90 ? '...' : '');
  const timeAgo = icebreaker.created_at
    ? formatDistanceToNow(new Date(icebreaker.created_at), { addSuffix: true })
    : '';
  const openers = icebreaker.openers || [];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.meta}>
          <Text style={styles.tone}>{icebreaker.tone}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
        {showDelete && (
          <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.bioLabel}>Their bio</Text>
      <Text style={styles.bioText}>{expanded ? matchBio : preview}</Text>
      {matchBio.length > 90 && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.expandBtn}>
          <Text style={styles.expandText}>{expanded ? 'Show less' : 'Show more'}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.divider} />

      {openers.map((opener, i) => (
        <View key={i} style={styles.openerRow}>
          {opener.locked ? (
            <View style={styles.lockedRow}>
              <MaterialCommunityIcons name="lock" size={14} color={colors.textMuted} />
              <Text style={styles.lockedText}>3rd opener locked — Pro only</Text>
            </View>
          ) : (
            <>
              <Text style={styles.openerText}>{opener.text}</Text>
              <TouchableOpacity onPress={() => handleCopy(opener.text, i)} style={styles.copyBtn}>
                <MaterialCommunityIcons
                  name={copiedIndex === i ? 'check' : 'content-copy'}
                  size={15}
                  color={copiedIndex === i ? colors.success : colors.textMuted}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      ))}
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tone: { fontSize: 13, fontWeight: '600', color: C.accentLight },
  dot: { color: C.textMuted },
  time: { fontSize: 12, color: C.textMuted },
  actionBtn: { padding: 4 },
  bioLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 4 },
  bioText: { fontSize: 13, color: C.textSecondary, lineHeight: 19 },
  expandBtn: { marginTop: 6 },
  expandText: { fontSize: 13, color: C.accent, fontWeight: '500' },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  openerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  openerText: { flex: 1, fontSize: 14, color: C.textPrimary, lineHeight: 21 },
  copyBtn: { padding: 2, marginTop: 2 },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lockedText: { fontSize: 13, color: C.textMuted, fontStyle: 'italic' },
});
