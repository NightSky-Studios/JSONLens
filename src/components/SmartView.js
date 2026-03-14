import React, { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../context/SettingsContext';
import { isArray, isObj } from '../helpers';
import VirtualTableView from './VirtualTableView';
import KVView           from './KVView';
import TreeNode         from './TreeNode';
import RawView          from './RawView';
import PathBreadcrumb   from './PathBreadcrumb';

const MODES = [
  { id: 'auto',  label: 'Auto'  },
  { id: 'table', label: 'Table' },
  { id: 'kv',    label: 'KV'   },
  { id: 'tree',  label: 'Tree'  },
  { id: 'raw',   label: 'Raw'   },
];

export default function SmartView({ data, search }) {
  const { theme } = useSettings();
  const [viewMode, setViewMode] = useState('auto');
  const [treePath, setTreePath] = useState([]);

  const isArrayOfObjs = isArray(data) && data.length > 0 && data.some((d) => isObj(d));
  const auto     = isArrayOfObjs ? 'table' : isObj(data) ? 'kv' : 'tree';
  const mode     = viewMode === 'auto' ? auto : viewMode;
  const canTable = isArray(data);
  const canKV    = isObj(data);

  // Drill-down navigation (tree mode)
  const drillData = treePath.reduce((node, key) => {
    if (node == null) return node;
    return node[key];
  }, data);

  const navigatePath = (idx) => {
    setTreePath(idx < 0 ? [] : treePath.slice(0, idx + 1));
  };

  const selectMode = (id) => {
    Haptics.selectionAsync().catch(() => {});
    setViewMode(id);
    if (id !== 'tree') setTreePath([]);
  };

  return (
    <View style={s.wrap}>
      {/* Mode bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[s.switcherScroll, { borderBottomColor: theme.border }]}
        contentContainerStyle={s.switcher}
      >
        {MODES.map((m) => {
          const active = viewMode === m.id;
          return (
            <Pressable
              key={m.id}
              style={[
                s.btn,
                { borderColor: active ? theme.accent : theme.border2 },
                active && { backgroundColor: theme.accent + '18' },
              ]}
              onPress={() => selectMode(m.id)}
              android_ripple={{ color: theme.accent + '33' }}
            >
              <Text style={[s.btnText, { color: active ? theme.accent : theme.muted }]}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Path breadcrumb (tree mode only) */}
      {mode === 'tree' && treePath.length > 0 && (
        <PathBreadcrumb path={treePath} onNavigate={navigatePath} />
      )}

      {/* Content */}
      <View style={s.content}>
        {mode === 'table' && canTable  && <VirtualTableView data={data}      search={search} />}
        {mode === 'kv'    && canKV     && <KVView           data={data}      search={search} />}
        {mode === 'raw'                && <RawView          data={data} />}
        {mode === 'tree' && (
          <ScrollView style={s.treeScroll} contentContainerStyle={s.treePad}>
            <TreeNode value={drillData ?? data} depth={0} />
          </ScrollView>
        )}
        {mode === 'table' && !canTable && <Hint theme={theme}>Not an array — switch to Tree or KV.</Hint>}
        {mode === 'kv'    && !canKV    && <Hint theme={theme}>Not an object — switch to Tree or Table.</Hint>}
      </View>
    </View>
  );
}

function Hint({ children, theme }) {
  return (
    <View style={{ padding: 24 }}>
      <Text style={{ color: theme.muted, fontStyle: 'italic', fontSize: 13 }}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:           { flex: 1 },
  switcherScroll: { flexGrow: 0, borderBottomWidth: 1 },
  switcher:       { flexDirection: 'row', gap: 6, padding: 10 },
  btn:            { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  btnText:        { fontSize: 12, fontWeight: '600' },
  content:        { flex: 1 },
  treeScroll:     { flex: 1 },
  treePad:        { padding: 16, paddingBottom: 48 },
});
