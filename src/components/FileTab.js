import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, Platform,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { useSettings }  from '../context/SettingsContext';
import { useToast }     from '../context/ToastContext';
import SmartView   from './SmartView';
import StatsPanel  from './StatsPanel';
import ErrorView   from './ErrorView';

const MONO = Platform.select({ android: 'monospace', ios: 'Courier New' });

export default function FileTab({ file }) {
  const { theme, fontSize } = useSettings();
  const { showToast } = useToast();
  const [search,       setSearch]       = useState('');
  const [metaExpanded, setMetaExpanded] = useState(false);

  const isError    = !!file.data?.error;
  const hasMeta    = !isError && !!file.data?.metadata?.columns?.length;
  const hasRecords = !isError && file.data?.records !== undefined;
  const viewData   = hasRecords ? file.data.records : file.data;

  const shareFile = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const uri = FileSystem.cacheDirectory + file.name;
      await FileSystem.writeAsStringAsync(uri, JSON.stringify(isError ? file.data : viewData, null, 2));
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/json' });
      } else {
        showToast({ message: 'Sharing not available on this device', type: 'error' });
      }
    } catch (e) {
      showToast({ message: 'Share failed', type: 'error' });
    }
  };

  return (
    <View style={s.wrap}>
      {/* ── Header ── */}
      <View style={[s.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={s.headerTop}>
          <View style={s.titleBlock}>
            <Text style={[s.fileName, { color: theme.text, fontSize: fontSize.ui + 2 }]} numberOfLines={1}>
              {file.name}
            </Text>
            {file.data?.section && (
              <Text style={[s.section, { color: theme.accent }]}>{file.data.section}</Text>
            )}
            {file.data?.generated_at && (
              <Text style={[s.genAt, { color: theme.muted, fontFamily: MONO, fontSize: fontSize.mono - 1 }]}>
                {new Date(file.data.generated_at).toLocaleString()}
              </Text>
            )}
          </View>
          <View style={s.headerActions}>
            {hasRecords && (
              <View style={[s.badge, { backgroundColor: theme.card, borderColor: theme.border2 }]}>
                <Text style={[s.badgeText, { color: theme.accent, fontSize: 10 }]}>
                  {file.data.record_count ?? file.data.records.length} rec
                </Text>
              </View>
            )}
            {isError && (
              <View style={[s.badge, { backgroundColor: theme.accent3 + '18', borderColor: theme.accent3 + '44' }]}>
                <Text style={[s.badgeText, { color: theme.accent3, fontSize: 10 }]}>⚠ Error</Text>
              </View>
            )}
            <Pressable
              onPress={shareFile}
              style={({ pressed }) => [s.iconBtn, { borderColor: theme.border2 }, pressed && { opacity: 0.6 }]}
              android_ripple={{ color: theme.accent + '33', borderless: true, radius: 16 }}
              hitSlop={8}
            >
              <Text style={[s.iconBtnTxt, { color: theme.muted }]}>⤴</Text>
            </Pressable>
          </View>
        </View>

        {/* Search - hide for error views */}
        {!isError && (
          <View style={[s.searchRow, { backgroundColor: theme.card, borderColor: theme.border2 }]}>
            <Text style={[s.searchIcon, { color: theme.muted }]}>⌕</Text>
            <TextInput
              style={[s.searchInput, { color: theme.text, fontSize: fontSize.ui }]}
              placeholder="Filter…"
              placeholderTextColor={theme.muted}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={10}>
                <Text style={[s.clearBtn, { color: theme.muted }]}>✕</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* ── Schema metadata ── */}
      {hasMeta && (
        <View style={[s.metaPanel, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <Pressable
            style={s.metaToggle}
            onPress={() => setMetaExpanded((e) => !e)}
            android_ripple={{ color: theme.border2 }}
          >
            <Text style={[s.metaToggleText, { color: theme.muted }]}>
              {metaExpanded ? '▾' : '▸'} Schema Metadata
              <Text style={{ color: theme.border2 }}> · {file.data.metadata.columns.length} cols</Text>
            </Text>
          </Pressable>
          {metaExpanded && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={s.metaCols}>
                {file.data.metadata.columns.map((col, i) => (
                  <View key={i} style={[s.metaCol, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[s.metaColName, { color: theme.accent2, fontFamily: MONO, fontSize: fontSize.mono }]}>{col.name}</Text>
                    {col.description && (
                      <Text style={[s.metaColDesc, { color: theme.muted, fontSize: fontSize.mono - 2 }]}>{col.description}</Text>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {/* ── Stats panel ── */}
      {!isError && <StatsPanel data={viewData} />}

      {/* ── Main content ── */}
      {isError
        ? <ErrorView file={file} />
        : <SmartView data={viewData} search={search} />
      }
    </View>
  );
}

const s = StyleSheet.create({
  wrap:   { flex: 1 },
  header: { borderBottomWidth: 1, padding: 14, gap: 10 },
  headerTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  titleBlock:   { flex: 1 },
  fileName:     { fontWeight: '700', letterSpacing: 0.2 },
  section:      { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4 },
  genAt:        { marginTop: 3 },
  headerActions:{ flexDirection: 'row', alignItems: 'center', gap: 7 },
  badge:        { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1 },
  badgeText:    { fontWeight: '700' },
  iconBtn:      { padding: 6, borderRadius: 8, borderWidth: 1 },
  iconBtnTxt:   { fontSize: 15, fontWeight: '700' },

  searchRow:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, gap: 8 },
  searchIcon:   { fontSize: 16 },
  searchInput:  { flex: 1, padding: 0 },
  clearBtn:     { fontSize: 12, padding: 2 },

  metaPanel:    { borderBottomWidth: 1 },
  metaToggle:   { padding: 10, paddingHorizontal: 14 },
  metaToggleText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  metaCols:     { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 12 },
  metaCol:      { borderRadius: 6, padding: 8, width: 180, borderWidth: 1 },
  metaColName:  { fontWeight: '600' },
  metaColDesc:  { marginTop: 4, lineHeight: 14 },
});
