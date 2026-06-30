import React, { useState, useMemo } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { radii } from '../constants/radii';

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
  tinder:    'e.g. Architect who surfs on weekends',
  okcupid:   'e.g. Biologist who overthinks every question on this app',
  cmb:       'e.g. Teacher looking for something real, not endless swiping',
  pof:       'e.g. Nurse who still believes in a good first date',
  happn:     'e.g. Designer who keeps crossing paths with interesting people',
  github:    'e.g. Full-stack engineer & open source contributor',
  discord:   'e.g. Game developer & community builder',
  reddit:    'e.g. Data scientist & hobby photographer',
  substack:  'e.g. Journalist covering climate & tech',
  medium:    'e.g. Writer exploring ideas at the edge of tech and culture',
  patreon:   'e.g. Illustrator & storyteller helping creators build their world',
  fiverr:    'e.g. Brand designer helping startups find their visual voice',
  facebook:  'e.g. Local business owner & community organizer',
  snapchat:  'e.g. Creative director & everyday adventurer',
  pinterest: 'e.g. Interior designer & slow living enthusiast',
  telegram:  'e.g. Crypto analyst & tech commentator',
  whatsapp:  'e.g. Personal trainer sharing daily wellness tips',
  spotify:   'e.g. Indie singer-songwriter exploring lo-fi and dream pop',
  twitch:    'e.g. FPS gamer & variety streamer, live every weeknight',
  mastodon:  'e.g. Open-source developer & digital rights advocate',
  bereal:    'e.g. Architecture student & weekend skater',
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
  tinder:    ['Spontaneous trips', 'Good food', 'Live music', 'Sunsets', 'Gym', 'Cooking', 'Movies', 'Hiking'],
  okcupid:   ['Deep conversations', 'Travel', 'Books', 'Trivia', 'Cooking', 'Hiking', 'Music', 'Debate'],
  cmb:       ['Coffee dates', 'Cooking', 'Travel', 'Reading', 'Yoga', 'Brunch', 'Museums', 'Wine'],
  pof:       ['Fishing', 'Cooking', 'Travel', 'Country music', 'Outdoors', 'Sports', 'Dogs', 'Bbq'],
  happn:     ['City walks', 'Coffee shops', 'Travel', 'Photography', 'Live music', 'Cycling', 'Food', 'Art'],
  github:    ['Open source', 'Web dev', 'AI/ML', 'DevOps', 'Mobile apps', 'Game dev', 'Security'],
  discord:   ['Gaming', 'Anime', 'Programming', 'Music', 'Art', 'Crypto', 'Streaming'],
  reddit:    ['Gaming', 'Science', 'Movies', 'Books', 'Sports', 'Cooking', 'Photography', 'Tech'],
  substack:  ['Writing', 'Journalism', 'Politics', 'Tech', 'Culture', 'Economics', 'History'],
  medium:    ['Self-improvement', 'Startups', 'Philosophy', 'Technology', 'Mental health', 'Creativity', 'Science'],
  patreon:   ['Illustration', 'Comics', 'Music', 'Podcasting', 'Filmmaking', 'Writing', 'Photography', 'Art'],
  fiverr:    ['Brand design', 'Copywriting', 'Web design', 'Motion graphics', 'SEO', 'Video editing', 'Illustration'],
  facebook:  ['Community', 'Family', 'Local events', 'Business', 'Cooking', 'Travel', 'Sports', 'DIY'],
  snapchat:  ['Streetwear', 'Travel', 'Food', 'Music', 'Comedy', 'Fitness', 'Art', 'Night life'],
  pinterest: ['Interior design', 'Fashion', 'Recipes', 'Travel', 'Minimalism', 'DIY', 'Gardening', 'Wedding'],
  telegram:  ['Crypto', 'News', 'Technology', 'Finance', 'Politics', 'Science', 'Privacy', 'Gaming'],
  whatsapp:  ['Fitness', 'Nutrition', 'Mindfulness', 'Travel', 'Cooking', 'Parenting', 'Business tips'],
  spotify:   ['Songwriting', 'Lo-fi', 'Indie', 'Guitar', 'Production', 'Jazz', 'Folk', 'Electronic'],
  twitch:    ['FPS games', 'RPGs', 'Speedrunning', 'Retro gaming', 'IRL', 'Cooking streams', 'Music', 'Art'],
  mastodon:  ['Open source', 'Linux', 'Privacy', 'Decentralization', 'Tech ethics', 'Photography', 'Writing'],
  bereal:    ['Photography', 'Architecture', 'Skating', 'Street food', 'Coffee', 'Concerts', 'Film', 'Nature'],
};

const DEFAULT_SUGGESTIONS = ['Reading', 'Travel', 'Music', 'Fitness', 'Cooking', 'Photography', 'Gaming', 'Coffee'];

export default function AboutYou({ navigation, route }) {
  const { platform } = route.params;
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
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
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
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
              placeholderTextColor={colors.textMuted}
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
                      colors={[colors.accent, colors.accentLight]}
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
                placeholderTextColor={colors.textMuted}
                value={tagInput}
                onChangeText={handleTagInputChange}
                onSubmitEditing={commitTagInput}
                returnKeyType="done"
                maxLength={50}
              />
              {tagInput.trim().length > 0 && (
                <TouchableOpacity onPress={commitTagInput} style={styles.tagAddBtn}>
                  <MaterialCommunityIcons name="plus-circle" size={22} color={colors.accent} />
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
                colors={[colors.accent, colors.accentLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.generateBtn}
              >
                <Text style={styles.generateText}>Generate my bio</Text>
                <Ionicons name="sparkles" size={18} color="#fff" />
              </LinearGradient>
            ) : (
              <View style={[styles.generateBtn, styles.generateDisabled]}>
                <Text style={[styles.generateText, { color: colors.textMuted }]}>
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

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontWeight: '700', color: C.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: C.textSecondary, marginTop: 2 },
  scroll: { paddingHorizontal: 20, paddingTop: 12 },
  field: { marginBottom: 22 },
  label: { fontSize: 14, fontWeight: '600', color: C.textSecondary, marginBottom: 8, letterSpacing: 0.2 },
  input: {
    backgroundColor: C.surface,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: C.textPrimary,
  },
  selectedTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  selectedTag: { borderRadius: radii.xl, overflow: 'hidden' },
  selectedTagInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, gap: 5 },
  selectedTagText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  tagInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: C.textPrimary },
  tagAddBtn: { paddingLeft: 6 },
  suggestLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionTag: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.xl,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  suggestionTagSelected: { borderColor: C.accent, backgroundColor: C.accent + '22' },
  suggestionTagText: { fontSize: 13, color: C.textSecondary },
  suggestionTagTextSelected: { color: C.accent, fontWeight: '600' },
  pills: { flexDirection: 'row', flexWrap: 'wrap' },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 16 : 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  generateOuter: { borderRadius: radii.md, overflow: 'hidden' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 17, gap: 8 },
  generateDisabled: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: radii.md },
  generateText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
});
