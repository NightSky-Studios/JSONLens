import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { isArray, isObj } from '../helpers';

function analyse(node, depth = 0) {
  const stats = { strings: 0, numbers: 0, booleans: 0, nulls: 0, objects: 0, arrays: 0, keys: 0, maxDepth: depth };

  const walk = (n, d) => {
    if (n === null || n === undefined) { stats.nulls++;   return; }
    if (typeof n === 'string')         { stats.strings++; return; }
    if (typeof n === 'number')         { stats.numbers++; return; }
    if (typeof n === 'boolean')        { stats.booleans++;return; }
    if (isArray(n)) {
      stats.arrays++;
      if (d > stats.maxDepth) stats.maxDepth = d;
      n.forEach((v) => walk(v, d + 1));
      return;
    }
    if (isObj(n)) {
      stats.objects++;
      if (d > stats.maxDepth) stats.maxDepth = d;
      Object.entries(n).forEach(([, v]) => { stats.keys++; walk(v, d + 1); });
    }
  };
  walk(node, depth);
  return stats;
}

const PILLS = [
  { key: 'strings',  label: 'Strings',  emoji: '𝐒' },
  { key: 'numbers',  label: 'Numbers',  emoji: '#' },
  { key: 'booleans', label: 'Bools',    emoji: '◉' },
  { key: 'nulls',    label: 'Nulls',    emoji: '∅' },
  { key: 'objects',  label: 'Objects',  emoji: '{}' },
  { key: 'arrays',   label: 'Arrays',   emoji: '[]' },
];

export default function StatsPanel({ data }) {
  const { theme, fontSize } = useSettings();
  const [open, setOpen] = useState(false);
  const MONO = Platform.select({ android: 'monospace', ios: 'Courier New' });

  const stats = useMemo(() => analyse(data), [data]);
  const total = stats.strings + stats.numbers + stats.booleans + stats.nulls;

  return (
    <View style={[s.wrap, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <Pressable
        style={s.header}
        onPress={() => setOpen((o) => !o)}
        android_ripple={{ color: theme.accent + '22' }}
      >
        <Text style={[s.headerText, { color: theme.muted }]}>
          {open ? '▾' : '▸'}  Stats
        </Text>
        <View style={s.chips}>
          {isArray(data) && (
            <Chip label={`${data.length} items`} color={theme.accent2} theme={theme} />
          )}
          {isObj(data) && (
            <Chip label={`${Object.keys(data).length} keys`} color={theme.accent2} theme={theme} />
          )}
          <Chip label={`depth ${stats.maxDepth}`} color={theme.muted} theme={theme} />
          <Chip label={`${total} values`} color={theme.muted} theme={theme} />
        </View>
      </Pressable>

      {open && (
        <View style={s.body}>
          <View style={s.pills}>
            {PILLS.map(({ key, label, emoji }) => {
              const val = stats[key];
              if (!val) return null;
              const pct = total > 0 ? Math.round((val / total) * 100) : 0;
              return (
                <View key={key} style={[s.pill, { backgroundColor: theme.card, borderColor: theme.border2 }]}>
                  <Text style={[s.pillEmoji, { color: theme.accent, fontFamily: MONO }]}>{emoji}</Text>
                  <View style={s.pillText}>
                    <Text style={[s.pillVal, { color: theme.text, fontSize: fontSize.mono }]}>{val}</Text>
                    <Text style={[s.pillLabel, { color: theme.muted }]}>{label}</Text>
                  </View>
                  {pct > 0 && (
                    <View style={[s.pillBar, { backgroundColor: theme.border2 }]}>
                      <View style={[s.pillFill, { width: `${pct}%`, backgroundColor: theme.accent + 'aa' }]} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {stats.keys > 0 && (
            <View style={[s.extraRow]}>
              <StatBit label="Total keys" value={stats.keys} theme={theme} fontSize={fontSize} MONO={MONO} />
              <StatBit label="Max depth"  value={stats.maxDepth} theme={theme} fontSize={fontSize} MONO={MONO} />
              <StatBit label="Objects"    value={stats.objects}  theme={theme} fontSize={fontSize} MONO={MONO} />
              <StatBit label="Arrays"     value={stats.arrays}   theme={theme} fontSize={fontSize} MONO={MONO} />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function Chip({ label, color, theme }) {
  return (
    <View style={[chip.wrap, { borderColor: color + '44', backgroundColor: color + '11' }]}>
      <Text style={[chip.txt, { color }]}>{label}</Text>
    </View>
  );
}

function StatBit({ label, value, theme, fontSize, MONO }) {
  return (
    <View style={sb.wrap}>
      <Text style={[sb.val, { color: theme.accent, fontFamily: MONO, fontSize: fontSize.mono + 2 }]}>{value}</Text>
      <Text style={[sb.label, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:    { borderBottomWidth: 1 },
  header:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, gap: 10 },
  headerText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  chips:   { flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap' },
  body:    { paddingHorizontal: 14, paddingBottom: 12, gap: 10 },
  pills:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, minWidth: 130, flex: 1 },
  pillEmoji: { fontSize: 14, width: 20, textAlign: 'center' },
  pillText:  { flex: 1 },
  pillVal:   { fontWeight: '700' },
  pillLabel: { fontSize: 10 },
  pillBar:   { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, overflow: 'hidden' },
  pillFill:  { height: '100%' },
  extraRow:  { flexDirection: 'row', gap: 8 },
});

const chip = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  txt:  { fontSize: 10, fontWeight: '700' },
});

const sb = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', padding: 10, borderRadius: 8 },
  val:   { fontWeight: '700' },
  label: { fontSize: 10, marginTop: 2 },
});
