import React, { useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform, Pressable,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import useCopy from '../hooks/useCopy';

// ── Syntax tokeniser ─────────────────────────────────────────────────────────
function tokenise(json) {
  const lines = json.split('\n');
  return lines.map((line) => {
    const tokens = [];
    let rest = line;

    const consume = (regex, type) => {
      const m = rest.match(regex);
      if (!m) return false;
      tokens.push({ text: m[0], type });
      rest = rest.slice(m[0].length);
      return true;
    };

    while (rest.length > 0) {
      // Leading whitespace
      if (consume(/^\s+/, 'ws')) continue;
      // Object key  "key":
      if (consume(/^"(?:[^"\\]|\\.)*"(?=\s*:)/, 'key')) continue;
      // String value
      if (consume(/^"(?:[^"\\]|\\.)*"/, 'str')) continue;
      // Number
      if (consume(/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/, 'num')) continue;
      // Boolean / null
      if (consume(/^(true|false|null)/, 'kw')) continue;
      // Punctuation
      if (consume(/^[{}[\],:]/, 'punct')) continue;
      // Fallback: eat one char
      tokens.push({ text: rest[0], type: 'ws' });
      rest = rest.slice(1);
    }

    return tokens;
  });
}

const LINE_H = 20;

export default function RawView({ data }) {
  const { theme, fontSize } = useSettings();
  const copy = useCopy();
  const MONO = Platform.select({ android: 'monospace', ios: 'Courier New' });

  const pretty = useMemo(() => JSON.stringify(data, null, 2), [data]);
  const tokenLines = useMemo(() => tokenise(pretty), [pretty]);
  const lineCount  = tokenLines.length;
  const lineNumWidth = String(lineCount).length * (fontSize.mono * 0.65) + 16;

  const typeColor = useCallback((type) => {
    switch (type) {
      case 'key':   return theme.accent2;
      case 'str':   return theme.text;
      case 'num':   return theme.accent;
      case 'kw':    return theme.warn;
      case 'punct': return theme.muted;
      default:      return theme.text;
    }
  }, [theme]);

  return (
    <View style={s.wrap}>
      {/* Toolbar */}
      <View style={[s.toolbar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[s.toolbarInfo, { color: theme.muted, fontFamily: MONO }]}>
          {lineCount} lines  ·  {pretty.length.toLocaleString()} chars
        </Text>
        <Pressable
          onPress={() => copy(data, 'JSON')}
          style={({ pressed }) => [s.copyBtn, { borderColor: theme.border2, backgroundColor: theme.surface }, pressed && s.pressed]}
          android_ripple={{ color: theme.accent + '33' }}
        >
          <Text style={[s.copyBtnTxt, { color: theme.accent }]}>⎘  Copy All</Text>
        </Pressable>
      </View>

      <ScrollView
        style={s.scroll}
        horizontal={false}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={true}
        indicatorStyle="white"
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {tokenLines.map((tokens, li) => (
              <View key={li} style={[s.line, { height: LINE_H }]}>
                {/* Line number */}
                <View style={[s.lineNumCol, { width: lineNumWidth, borderRightColor: theme.border }]}>
                  <Text style={[s.lineNum, { color: theme.border2, fontFamily: MONO, fontSize: fontSize.mono - 1 }]}>
                    {li + 1}
                  </Text>
                </View>
                {/* Code */}
                <View style={s.lineCode}>
                  {tokens.map((tok, ti) => (
                    <Text
                      key={ti}
                      style={[s.tok, { color: typeColor(tok.type), fontFamily: MONO, fontSize: fontSize.mono }]}
                    >
                      {tok.text}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
            {/* Bottom padding */}
            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:    { flex: 1 },
  toolbar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 1,
  },
  toolbarInfo: { fontSize: 11 },
  copyBtn:  {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1,
  },
  copyBtnTxt:{ fontSize: 12, fontWeight: '700' },
  pressed:  { opacity: 0.65 },

  scroll:   { flex: 1 },
  content:  { paddingBottom: 8 },

  line:     { flexDirection: 'row', alignItems: 'center' },
  lineNumCol:{
    justifyContent: 'center', alignItems: 'flex-end',
    paddingHorizontal: 8, borderRightWidth: 1,
  },
  lineNum:  { opacity: 0.5 },
  lineCode: { flexDirection: 'row', paddingHorizontal: 10, flexWrap: 'nowrap' },
  tok:      { lineHeight: 20 },
});
