import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Pressable } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { formatValue, kindColor, isObj, isArray } from '../helpers';
import TreeNode from './TreeNode';
import useCopy from '../hooks/useCopy';

const MONO = Platform.select({ android: 'monospace', ios: 'Courier New' });

export default function KVView({ data, search }) {
  const { theme, fontSize } = useSettings();
  const copy = useCopy();

  const entries = Object.entries(data).filter(([k, v]) => {
    if (!search) return true;
    return (k + JSON.stringify(v)).toLowerCase().includes(search.toLowerCase());
  });

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      {entries.map(([k, v]) => {
        const complex = isObj(v) || isArray(v);
        const { text, kind } = formatValue(v);
        return (
          <Pressable
            key={k}
            style={({ pressed }) => [
              s.row,
              { borderBottomColor: theme.border },
              pressed && { backgroundColor: theme.accent + '0c' },
            ]}
            onLongPress={() => copy(v, k)}
            delayLongPress={450}
            android_ripple={{ color: theme.accent + '18' }}
          >
            <Text style={[s.key, { color: theme.muted, fontFamily: MONO, fontSize: fontSize.mono }]} numberOfLines={2}>{k}</Text>
            <View style={s.valWrap}>
              {complex
                ? <TreeNode value={v} depth={0} />
                : <Text style={[s.val, { color: kindColor(kind, theme), fontFamily: MONO, fontSize: fontSize.mono }]}>{text}</Text>
              }
            </View>
          </Pressable>
        );
      })}
      {entries.length === 0 && (
        <Text style={[s.empty, { color: theme.muted }]}>No matching keys</Text>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:   { flex: 1 },
  content:  { paddingHorizontal: 16, paddingBottom: 40 },
  row: {
    flexDirection: 'row', paddingVertical: 12,
    borderBottomWidth: 1, gap: 12, alignItems: 'flex-start',
  },
  key:     { fontWeight: '500', width: 150, flexShrink: 0, paddingTop: 1 },
  valWrap: { flex: 1 },
  val:     { flexWrap: 'wrap' },
  empty:   { padding: 24, textAlign: 'center', fontStyle: 'italic', fontSize: 13 },
});
