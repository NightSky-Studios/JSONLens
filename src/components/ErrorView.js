import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import useCopy from '../hooks/useCopy';
import { Pressable } from 'react-native';

const MONO = Platform.select({ android: 'monospace', ios: 'Courier New' });

export default function ErrorView({ file }) {
  const { theme, fontSize } = useSettings();
  const copy = useCopy();

  const raw    = file.data?.raw    ?? '';
  const errMsg = file.data?.error  ?? 'Unknown error';

  return (
    <ScrollView style={[s.wrap, { backgroundColor: theme.bg }]} contentContainerStyle={s.content}>
      {/* Error badge */}
      <View style={[s.badge, { backgroundColor: theme.accent3 + '18', borderColor: theme.accent3 + '44' }]}>
        <Text style={[s.badgeIcon, { color: theme.accent3 }]}>⚠</Text>
        <View style={s.badgeText}>
          <Text style={[s.badgeTitle, { color: theme.accent3 }]}>Invalid JSON</Text>
          <Text style={[s.badgeMsg, { color: theme.text }]}>{errMsg}</Text>
        </View>
      </View>

      {/* Tips */}
      <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[s.cardTitle, { color: theme.muted }]}>COMMON CAUSES</Text>
        {[
          'Trailing commas after the last item',
          'Single quotes instead of double quotes',
          'Unescaped special characters in strings',
          'Missing or mismatched brackets/braces',
          'File is not JSON (e.g. JSONL, JSON5, CSV)',
        ].map((tip, i) => (
          <View key={i} style={[s.tipRow, { borderTopColor: i === 0 ? 'transparent' : theme.border }]}>
            <Text style={[s.tipDot, { color: theme.accent }]}>·</Text>
            <Text style={[s.tipTxt, { color: theme.text, fontSize: fontSize.ui }]}>{tip}</Text>
          </View>
        ))}
      </View>

      {/* Raw preview */}
      {raw.length > 0 && (
        <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={s.rawHeader}>
            <Text style={[s.cardTitle, { color: theme.muted }]}>RAW PREVIEW (first 500 chars)</Text>
            <Pressable
              onPress={() => copy(raw, 'raw content')}
              android_ripple={{ color: theme.accent + '33' }}
              style={({ pressed }) => [s.copyBtn, { borderColor: theme.border2 }, pressed && { opacity: 0.6 }]}
            >
              <Text style={[s.copyTxt, { color: theme.accent }]}>⎘ Copy</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <Text style={[s.rawText, { color: theme.text, fontFamily: MONO, fontSize: fontSize.mono, backgroundColor: theme.surface }]}>
              {raw.slice(0, 500)}
              {raw.length > 500 && '\n…'}
            </Text>
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap:    { flex: 1 },
  content: { padding: 16, gap: 14 },
  badge: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 16, borderRadius: 14, borderWidth: 1,
  },
  badgeIcon:  { fontSize: 24 },
  badgeText:  { flex: 1, gap: 4 },
  badgeTitle: { fontSize: 15, fontWeight: '700' },
  badgeMsg:   { fontSize: 13, lineHeight: 19 },

  card:       { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  cardTitle:  { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, padding: 12, paddingBottom: 8 },
  tipRow:     { flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: 1, alignItems: 'flex-start' },
  tipDot:     { fontSize: 18, lineHeight: 20 },
  tipTxt:     { flex: 1, lineHeight: 20 },

  rawHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 12 },
  rawText:    { padding: 12, lineHeight: 18 },
  copyBtn:    { padding: 6, borderRadius: 6, borderWidth: 1 },
  copyTxt:    { fontSize: 11, fontWeight: '700' },
});
