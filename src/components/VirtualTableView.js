import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, ScrollView, Pressable,
  StyleSheet, Modal, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../context/SettingsContext';
import { detectColumns, formatValue, kindColor, isObj, isArray } from '../helpers';
import TreeNode from './TreeNode';
import useCopy from '../hooks/useCopy';

const COL_WIDTH  = 165;
const IDX_WIDTH  = 40;
const ROW_HEIGHT = 44;
const MONO = Platform.select({ android: 'monospace', ios: 'Courier New' });

// ── Highlight matched text ─────────────────────────────────────────────────
function HighlightText({ text, search, style, numberOfLines }) {
  const { theme } = useSettings();
  if (!search || !text.toLowerCase().includes(search.toLowerCase())) {
    return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
  }
  const parts = [];
  let rest = text;
  const lower = search.toLowerCase();
  while (rest.length > 0) {
    const idx = rest.toLowerCase().indexOf(lower);
    if (idx === -1) { parts.push({ t: rest, hl: false }); break; }
    if (idx > 0)    parts.push({ t: rest.slice(0, idx), hl: false });
    parts.push({ t: rest.slice(idx, idx + search.length), hl: true });
    rest = rest.slice(idx + search.length);
  }
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((p, i) =>
        p.hl
          ? <Text key={i} style={[style, { backgroundColor: theme.warn + '55', color: theme.warn }]}>{p.t}</Text>
          : <Text key={i}>{p.t}</Text>
      )}
    </Text>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function VirtualTableView({ data, search }) {
  const { theme, fontSize } = useSettings();
  const copy  = useCopy();
  const hScrollRef = useRef(null);

  const [sort,  setSort]  = useState({ col: null, dir: 1 });
  const [modal, setModal] = useState(null);

  const cols = useMemo(() => detectColumns(data), [data]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [data, search]);

  const sorted = useMemo(() => {
    if (!sort.col) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String(a[sort.col] ?? '');
      const bv = String(b[sort.col] ?? '');
      return av.localeCompare(bv, undefined, { numeric: true }) * sort.dir;
    });
  }, [filtered, sort]);

  const toggleSort = useCallback((col) => {
    Haptics.selectionAsync().catch(() => {});
    setSort((s) => s.col === col ? { col, dir: s.dir * -1 } : { col, dir: 1 });
  }, []);

  const openModal = useCallback((value, label) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setModal({ value, label });
  }, []);

  // ── Header row (sticky) ──────────────────────────────────────────────────
  const HeaderRow = useMemo(() => (
    <View style={[s.headerRow, { backgroundColor: theme.card, borderBottomColor: theme.border2 }]}>
      <View style={[s.th, { width: IDX_WIDTH, borderRightColor: theme.border }]}>
        <Text style={[s.thText, { color: theme.muted }]}>#</Text>
      </View>
      {cols.map((col) => {
        const active = sort.col === col;
        return (
          <Pressable
            key={col}
            style={[s.th, { width: COL_WIDTH, borderRightColor: theme.border }]}
            onPress={() => toggleSort(col)}
            onLongPress={() => copy(col, 'column name')}
            android_ripple={{ color: theme.accent + '33' }}
          >
            <Text
              style={[s.thText, { color: active ? theme.accent : theme.muted, fontSize: fontSize.mono - 1 }]}
              numberOfLines={1}
            >
              {col}{'  '}
              <Text style={{ fontSize: 9, opacity: 0.7 }}>
                {active ? (sort.dir === 1 ? '↑' : '↓') : '⇅'}
              </Text>
            </Text>
          </Pressable>
        );
      })}
    </View>
  ), [cols, sort, theme, fontSize]);

  // ── Data row renderer (FlatList) ─────────────────────────────────────────
  const renderRow = useCallback(({ item: row, index: ri }) => (
    <Pressable
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        copy(row, `row ${ri + 1}`);
      }}
      delayLongPress={500}
      style={[
        s.dataRow,
        { borderBottomColor: theme.border, minHeight: ROW_HEIGHT },
        ri % 2 === 0 ? { backgroundColor: theme.surface } : { backgroundColor: theme.bg },
      ]}
    >
      {/* Row index */}
      <View style={[s.td, { width: IDX_WIDTH, borderRightColor: theme.border }]}>
        <Text style={[s.tdIdx, { color: theme.muted, fontFamily: MONO, fontSize: fontSize.mono - 2 }]}>
          {ri + 1}
        </Text>
      </View>

      {cols.map((col) => {
        const v = row[col];
        const complex = isObj(v) || isArray(v);
        const { text, kind } = formatValue(v);
        return (
          <Pressable
            key={col}
            style={[
              s.td,
              { width: COL_WIDTH, borderRightColor: theme.border },
              complex && { backgroundColor: theme.accent2 + '0e' },
            ]}
            onPress={() => complex && openModal(v, col)}
            onLongPress={() => copy(v, col)}
            delayLongPress={450}
            android_ripple={{ color: complex ? theme.accent2 + '33' : theme.accent + '22' }}
          >
            {complex ? (
              <Text style={[s.complexCell, { color: theme.muted, fontFamily: MONO, fontSize: fontSize.mono }]}>
                {text} ↗
              </Text>
            ) : (
              <HighlightText
                text={text}
                search={search}
                style={[s.tdText, { color: kindColor(kind, theme), fontFamily: MONO, fontSize: fontSize.mono }]}
                numberOfLines={2}
              />
            )}
          </Pressable>
        );
      })}
    </Pressable>
  ), [cols, sort, search, theme, fontSize, copy, openModal]);

  const keyExtractor = useCallback((_, i) => String(i), []);

  const totalWidth = IDX_WIDTH + cols.length * COL_WIDTH;

  return (
    <View style={s.wrap}>
      {/* Meta row */}
      <View style={[s.metaBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[s.metaTxt, { color: theme.muted, fontFamily: MONO, fontSize: fontSize.mono - 2 }]}>
          {sorted.length.toLocaleString()} row{sorted.length !== 1 ? 's' : ''}
          {'  ·  '}{cols.length} col{cols.length !== 1 ? 's' : ''}
          {search ? `  ·  ${filtered.length} matched` : ''}
        </Text>
        <Text style={[s.metaHint, { color: theme.border2, fontSize: 10 }]}>
          long-press row or cell to copy
        </Text>
      </View>

      {/* Horizontal + vertical scroll */}
      <ScrollView
        ref={hScrollRef}
        horizontal
        showsHorizontalScrollIndicator
        style={s.hScroll}
        indicatorStyle="white"
      >
        <View style={{ width: totalWidth }}>
          {HeaderRow}
          <FlatList
            data={sorted}
            renderItem={renderRow}
            keyExtractor={keyExtractor}
            getItemLayout={(_, index) => ({
              length: ROW_HEIGHT,
              offset: ROW_HEIGHT * index,
              index,
            })}
            initialNumToRender={20}
            maxToRenderPerBatch={30}
            windowSize={10}
            removeClippedSubviews
            showsVerticalScrollIndicator
            indicatorStyle="white"
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={[s.emptyTxt, { color: theme.muted }]}>
                  {search ? 'No rows match your filter' : 'No data'}
                </Text>
              </View>
            }
          />
        </View>
      </ScrollView>

      {/* Detail modal */}
      <Modal
        visible={!!modal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setModal(null)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setModal(null)}>
          <View
            style={[s.modalSheet, { backgroundColor: theme.card, borderColor: theme.border2 }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={[s.modalHandle, { backgroundColor: theme.border2 }]} />
            <View style={[s.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[s.modalTitle, { color: theme.text }]}>
                {modal?.label ?? 'Detail'}
              </Text>
              <View style={s.modalActions}>
                {modal && (
                  <Pressable
                    onPress={() => copy(modal.value, modal.label)}
                    style={[s.modalCopyBtn, { borderColor: theme.border2, backgroundColor: theme.surface }]}
                    android_ripple={{ color: theme.accent + '44', borderless: true, radius: 16 }}
                  >
                    <Text style={[s.modalCopyTxt, { color: theme.accent }]}>⎘ Copy</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => setModal(null)} hitSlop={10}
                  android_ripple={{ color: theme.border2, radius: 20, borderless: true }}
                >
                  <Text style={[s.modalClose, { color: theme.muted }]}>✕</Text>
                </Pressable>
              </View>
            </View>
            <ScrollView style={s.modalBody}>
              {modal && <TreeNode value={modal.value} depth={0} />}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:      { flex: 1 },
  metaBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 7, borderBottomWidth: 1,
  },
  metaTxt:   {},
  metaHint:  {},
  hScroll:   { flex: 1 },
  headerRow: { flexDirection: 'row', borderBottomWidth: 1, position: 'sticky', top: 0, zIndex: 1 },
  dataRow:   { flexDirection: 'row', borderBottomWidth: 1 },
  th:        { paddingHorizontal: 10, paddingVertical: 10, justifyContent: 'center', borderRightWidth: 1 },
  thText:    { fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  td:        { paddingHorizontal: 10, paddingVertical: 9, justifyContent: 'center', borderRightWidth: 1 },
  tdIdx:     { textAlign: 'center' },
  tdText:    {},
  complexCell: { fontStyle: 'italic' },
  empty:     { padding: 32, alignItems: 'center' },
  emptyTxt:  { fontStyle: 'italic', fontSize: 13 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet:   {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderBottomWidth: 0,
    maxHeight: '75%',
    paddingBottom: Platform.OS === 'android' ? 20 : 36,
  },
  modalHandle:  { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 8, marginBottom: 2 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  modalTitle:   { fontSize: 14, fontWeight: '700' },
  modalActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalCopyBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  modalCopyTxt: { fontSize: 12, fontWeight: '700' },
  modalClose:   { fontSize: 16, padding: 4 },
  modalBody:    { padding: 16 },
});
