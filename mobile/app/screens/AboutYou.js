import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import TonePill from '../components/TonePill';
import Colors from '../constants/colors';

const TONES = [
  'Friendly', 'Professional', 'Witty', 'Bold', 'Minimal',
  'Casual', 'Inspirational', 'Humble', 'Authentic', 'Confident',
];
const LENGTHS = ['Short', 'Medium', 'Long'];

const ROLE_PLACEHOLDERS = {
  linkedin:  'e.g. Senior Product Designer at Google',
  instagram: 'e.g. Content creator & travel photographer',
  twitter:   'e.g. Software engineer & startup founder',
  threads:   'e.g. Writer & creative director',
  tiktok:    'e.g. Fitness coach & lifestyle creator',
  youtube:   'e.g. Tech reviewer & DIY enthusiast',
  hinge:     'e.g. Nurse who loves the outdoors',
  bumble:    'e.g. Marketing manager by day, chef by night',
  github:    'e.g. Full-stack engineer & open source contributor',
  discord:   'e.g. Game developer & community builder',
  reddit:    'e.g. Data scientist & hobby photographer',
  substack:  'e.g. Journalist covering climate & tech',
};

const INTEREST_SUGGESTIONS = {
  linkedin:  ['Leadership', 'Startups', 'AI & ML', 'Product management', 'Remote work', 'Sustainability', 'Entrepreneurship', 'Design thinking'],
  instagram: ['Travel', 'Photography', 'Fitness', 'Food', 'Fashion', 'Wellness', 'Art', 'Lifestyle', 'Coffee'],
  twitter:   ['Tech', 'Startups', 'Politics', 'Crypto', 'AI', 'Books', 'Philosophy', 'Science'],
  threads:   ['Creativity', 'Culture', 'Writing', 'Design', 'Music', 'Film', 'Fashion', 'Art'],
  tiktok:    ['Dancing', 'Comedy', 'Cooking', 'Fitness', 'Gaming', 'Beauty', 'DIY', 'Pets'],
  youtube:   ['Tech reviews', 'Gaming', 'Cooking', 'Travel vlogs', 'Tutorials', 'Music', 'Fitness'],
  hinge:     ['Hiking', 'Cooking', 'Travel', 'Reading', 'Coffee', 'Music', 'Yoga', 'Dogs', 'Wine'],
  bumble:    ['Brunch', 'Concerts', 'Gym', 'Travel', 'Board games', 'Cooking', 'Movies', 'Coffee'],
  github:    ['Open source', 'Web dev', 'AI/ML', 'DevOps', 'Mobile apps', 'Game dev', 'Security'],
  discord:   ['Gaming', 'Anime', 'Programming', 'Music', 'Art', 'Crypto', 'Streaming'],
  reddit:    ['Gaming', 'Science', 'Movies', 'Books', 'Sports', 'Cooking', 'Photography', 'Tech'],
  substack:  ['Writing', 'Journalism', 'Politics', 'Tech', 'Culture', 'Economics', 'History'],
};

const DEFAULT_SUGGESTIONS = ['Reading', 'Travel', 'Music', 'Fitness', 'Cooking', 'Photography', 'Gaming', 'Coffee'];

export default function AboutYou({ navigation, route }) {
  const { platform } = route.params;

  const [role, setRole] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tone, setTone] = useState('Friendly');
  const [length, setLength] = useState('Medium');

  const suggestions = INTEREST_SUGGESTIONS[platform.id] || DEFAULT_SUGGESTIONS;
  const canGenerate = role.trim().length > 0 && selectedTags.length > 0;

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const commitTagInput = () => {
    const tag = tagInput.trim();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
    setTagInput('');
  };

  const handleTagInputChange = (text) => {
    if (text.endsWith(',')) {
      const tag = text.slice(0, -1).trim();
      if (tag && !selectedTags.includes(tag)) {
        setSelectedTags((prev) => [...prev, tag]);
      }
      setTagInput('');
    } else {
      setTagInput(text);
    }
  };

  const handleGenerate = () => {
    if (!canGenerate) return;
    navigation.navigate('Loading', {
      platform,
      role,
      interests: selectedTags.join(', '),
      tone,
      length,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Tell us about you</Text>
            <Text style={styles.subtitle}>For your {platform.name} bio</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* What do you do */}
          <View style={styles.field}>
            <Text style={styles.label}>What do you do?</Text>
            <TextInput
              style={styles.input}
              placeholder={ROLE_PLACEHOLDERS[platform.id] || 'e.g. Product designer at a startup'}
              placeholderTextColor={Colors.textMuted}
              value={role}
              onChangeText={setRole}
              returnKeyType="next"
              maxLength={120}
            />
          </View>

          {/* Interests — tag system */}
          <View style={styles.field}>
            <Text style={styles.label}>Things you love or are proud of</Text>

            {/* Selected tags */}
            {selectedTags.length > 0 && (
              <View style={styles.selectedTags}>
                {selectedTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={styles.selectedTag}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={[Colors.accent, Colors.accentLight]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.selectedTagInner}
                    >
                      <Text style={styles.selectedTagText}>{tag}</Text>
                      <MaterialCommunityIcons name="close" size={13} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Custom tag input */}
            <View style={styles.tagInputRow}>
              <TextInput
                style={styles.tagInput}
                placeholder="Add your own (comma to add)..."
                placeholderTextColor={Colors.textMuted}
                value={tagInput}
                onChangeText={handleTagInputChange}
                onSubmitEditing={commitTagInput}
                returnKeyType="done"
                maxLength={50}
              />
              {tagInput.trim().length > 0 && (
                <TouchableOpacity onPress={commitTagInput} style={styles.tagAddBtn}>
                  <MaterialCommunityIcons name="plus-circle" size={22} color={Colors.accent} />
                </TouchableOpacity>
              )}
            </View>

            {/* Suggestions */}
            <Text style={styles.suggestLabel}>Suggestions</Text>
            <View style={styles.suggestions}>
              {suggestions.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={[styles.suggestionTag, isSelected && styles.suggestionTagSelected]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.suggestionTagText, isSelected && styles.suggestionTagTextSelected]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Tone */}
          <View style={styles.field}>
            <Text style={styles.label}>Tone</Text>
            <View style={styles.pills}>
              {TONES.map((t) => (
                <TonePill key={t} label={t} isSelected={tone === t} onPress={() => setTone(t)} />
              ))}
            </View>
          </View>

          {/* Length */}
          <View style={styles.field}>
            <Text style={styles.label}>Length</Text>
            <View style={styles.pills}>
              {LENGTHS.map((l) => (
                <TonePill key={l} label={l} isSelected={length === l} onPress={() => setLength(l)} />
              ))}
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Generate button */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={!canGenerate}
            activeOpacity={0.85}
            style={styles.generateOuter}
          >
            {canGenerate ? (
              <LinearGradient
                colors={[Colors.accent, Colors.accentLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.generateBtn}
              >
                <Text style={styles.generateText}>Generate my bio</Text>
                <Ionicons name="sparkles" size={18} color="#fff" />
              </LinearGradient>
            ) : (
              <View style={[styles.generateBtn, styles.generateDisabled]}>
                <Text style={[styles.generateText, { color: Colors.textMuted }]}>
                  {!role.trim() ? 'Tell us what you do first' : 'Add at least one interest'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  backBtn: { padding: 4 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  field: { marginBottom: 22 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
  },

  // Selected tags
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  selectedTag: { borderRadius: 20, overflow: 'hidden' },
  selectedTagInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 5,
  },
  selectedTagText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  // Custom tag input
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  tagInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  tagAddBtn: { paddingLeft: 6 },

  // Suggestions
  suggestLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textMuted,
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionTag: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  suggestionTagSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '22',
  },
  suggestionTagText: { fontSize: 13, color: Colors.textSecondary },
  suggestionTagTextSelected: { color: Colors.accent, fontWeight: '600' },

  // Tone / Length pills
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 16 : 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  generateOuter: { borderRadius: 14, overflow: 'hidden' },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: 8,
  },
  generateDisabled: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
  },
  generateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
});
