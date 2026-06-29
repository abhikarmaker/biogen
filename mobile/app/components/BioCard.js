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
import { PLATFORMS } from '../constants/platforms';

const PLATFORM_NAMES = Object.fromEntries(PLATFORMS.map((p) => [p.id, p.name]));

export default function BioCard({ bio, onDelete, showDelete = false }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(bio.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    Alert.alert('Delete bio?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(bio.id) },
    ]);
  };

  const preview = bio.content.slice(0, 100) + (bio.content.length > 100 ? '...' : '');
  const timeAgo = bio.created_at
    ? formatDistanceToNow(new Date(bio.created_at), { addSuffix: true })
    : '';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.meta}>
          <Text style={styles.platform}>{PLATFORM_NAMES[bio.platform] || bio.platform}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleCopy} style={styles.actionBtn}>
            <MaterialCommunityIcons
              name={copied ? 'check' : 'content-copy'}
              size={16}
              color={copied ? colors.success : colors.textMuted}
            />
          </TouchableOpacity>
          {showDelete && (
            <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
              <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.content}>{expanded ? bio.content : preview}</Text>

      {bio.content.length > 100 && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.expandBtn}>
          <Text style={styles.expandText}>{expanded ? 'Show less' : 'Show more'}</Text>
        </TouchableOpacity>
      )}
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
  platform: { fontSize: 13, fontWeight: '600', color: C.accentLight },
  dot: { color: C.textMuted },
  time: { fontSize: 12, color: C.textMuted },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 4 },
  content: { fontSize: 14, color: C.textPrimary, lineHeight: 21 },
  expandBtn: { marginTop: 8 },
  expandText: { fontSize: 13, color: C.accent, fontWeight: '500' },
});
