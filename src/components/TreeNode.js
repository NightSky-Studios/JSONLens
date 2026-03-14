import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../context/SettingsContext';
import { isArray, isObj, formatValue, kindColor } from '../helpers';
import useCopy from '../hooks/useCopy';

const MONO = Platform.select({ android: 'monospace', ios: 'Courier New' });

export default function TreeNode({ nodeKey, value, depth = 0 }) {
  const { theme, fontSize } = useSettings();
  const [open, setOpen]   = useState(depth < 2);
  const [flash, setFlash] = useState(false);
  const copy = useCopy();
  const complex = isObj(value) || isArray(value);
  const indent  = depth * 14;

  const toggle = () => {
    Haptics.selectionAsync().catch(() => {});
    setOpen((o) => !o);
  };

  const handleLongPress = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 500);
    copy(value, nodeKey !== undefined ? String(nodeKey) : undefined);
  };

  if (!complex) {
    const { text, kind } = formatValue(value);
    return (
      <Pressable
        style={({ pressed }) => [
          s.row, { paddingLeft: 8 + indent },
          (pressed || flash) && { backgroundColor: theme.accent + '1a', borderRadius: 4 },
        ]}
        onLongPress={handleLongPress}
        delayLongPress={450}
      >
        {nodeKey !== undefined && (
          <Text style={[s.key, { color: theme.accent2, fontSize: fontSize.mono }]}>{String(nodeKey)}: </Text>
        )}
        <Text style={[s.val, { color: kindColor(kind, theme), fontSize: fontSize.mono }]} numberOfLines={4} selectable>
          {text}
        </Text>
        <Text style={[s.copyHint, { color: theme.border2 }]}> ⁝</Text>
      </Pressable>
    );
  }

  const entries = isArray(value) ? value.map((v, i) => [i, v]) : Object.entries(value);
  const typeLabel = isArray(value) ? `[${value.length}]` : `{${entries.length}}`;

  return (
    <View>
      <Pressable
        style={({ pressed }) => [
          s.row, s.toggle, { paddingLeft: 8 + indent },
          (pressed || flash) && { backgroundColor: theme.accent + '1a', borderRadius: 4 },
        ]}
        onPress={toggle}
        onLongPress={handleLongPress}
        delayLongPress={450}
        android_ripple={{ color: theme.accent + '22', borderless: false }}
      >
        <Text style={[s.arrow, { color: theme.accent, fontSize: fontSize.mono }]}>{open ? '▾' : '▸'} </Text>
        {nodeKey !== undefined && (
          <Text style={[s.key, { color: theme.accent2, fontSize: fontSize.mono }]}>{String(nodeKey)}</Text>
        )}
        <Text style={[s.typeTag, { color: theme.muted, fontSize: fontSize.mono - 1 }]}> {typeLabel}</Text>
      </Pressable>
      {open && (
        <View style={[s.children, { borderLeftColor: theme.border2 + '88' }]}>
          {entries.map(([k, v]) => (
            <TreeNode key={String(k)} nodeKey={k} value={v} depth={depth + 1} />
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row:      { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 4, paddingRight: 24, alignItems: 'baseline' },
  toggle:   { alignItems: 'center', borderRadius: 4 },
  key:      { fontFamily: MONO },
  val:      { fontFamily: MONO, flexShrink: 1 },
  typeTag:  { fontFamily: MONO, fontStyle: 'italic' },
  arrow:    { fontFamily: MONO, width: 14 },
  copyHint: { fontSize: 9 },
  children: { borderLeftWidth: 1, marginLeft: 14, paddingLeft: 0 },
});
