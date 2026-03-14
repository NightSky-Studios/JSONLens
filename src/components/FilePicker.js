import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  ActivityIndicator, Alert, Platform, Modal, ScrollView, Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../context/SettingsContext';
import { useRecent }   from '../context/RecentContext';

const MONO = Platform.select({ android: 'monospace', ios: 'Courier New' });

function formatBytes(b) {
  if (!b) return '';
  if (b < 1024)       return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60)   return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Recent files modal ──────────────────────────────────────────────────────
function RecentModal({ visible, onClose, theme }) {
  const { recents, clearRecents } = useRecent();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={[rm.overlay]} onPress={onClose}>
        <View
          style={[rm.card, { backgroundColor: theme.card, borderColor: theme.border2 }]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <View style={[rm.header, { borderBottomColor: theme.border }]}>
            <Text style={[rm.title, { color: theme.text }]}>Recently Opened</Text>
            {recents.length > 0 && (
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{}); clearRecents(); }}
                style={[rm.clearBtn, { borderColor: theme.border2 }]}
                android_ripple={{ color: theme.accent3 + '44' }}
              >
                <Text style={[rm.clearTxt, { color: theme.accent3 }]}>Clear</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose} hitSlop={10}
              android_ripple={{ color: theme.border2, radius: 20, borderless: true }}
            >
              <Text style={[rm.close, { color: theme.muted }]}>✕</Text>
            </Pressable>
          </View>

          {recents.length === 0 ? (
            <View style={rm.empty}>
              <Text style={[rm.emptyTxt, { color: theme.muted }]}>No recent files</Text>
            </View>
          ) : (
            <ScrollView style={rm.list}>
              {recents.map((r, i) => (
                <View
                  key={i}
                  style={[rm.row, { borderBottomColor: theme.border }]}
                >
                  <View style={[rm.fileIcon, { backgroundColor: theme.accent + '18', borderColor: theme.accent + '44' }]}>
                    <Text style={[{ color: theme.accent, fontSize: 14 }]}>{ }</Text>
                  </View>
                  <View style={rm.info}>
                    <Text style={[rm.name, { color: theme.text, fontFamily: MONO }]} numberOfLines={1}>{r.name}</Text>
                    <Text style={[rm.meta, { color: theme.muted }]}>
                      {formatBytes(r.size)}  ·  {timeAgo(r.openedAt)}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

// ── Main FilePicker ─────────────────────────────────────────────────────────
export default function FilePicker({ onFiles, compact = false }) {
  const { theme } = useSettings();
  const [loading,      setLoading]      = useState(false);
  const [recentVisible,setRecentVisible]= useState(false);

  const pickFiles = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json', 'text/plain', '*/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      for (const asset of result.assets) {
        try {
          const raw = await FileSystem.readAsStringAsync(asset.uri);
          let data;
          try {
            data = JSON.parse(raw);
          } catch (parseErr) {
            data = { error: parseErr.message, raw: raw.slice(0, 600) };
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          onFiles({ name: asset.name, data, id: asset.name + Date.now() });
        } catch (e) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          Alert.alert('Read Error', `Could not read ${asset.name}: ${e.message}`);
        }
      }
    } catch (e) {
      if (!String(e).includes('cancel')) Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Compact mode (topbar button) ─────────────────────────────────────
  if (compact) {
    return (
      <>
        <Pressable
          style={({ pressed }) => [
            s.compactBtn,
            { borderColor: theme.accent, backgroundColor: theme.accent + '18' },
            pressed && s.pressed,
          ]}
          onPress={pickFiles}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setRecentVisible(true);
          }}
          delayLongPress={500}
          android_ripple={{ color: theme.accent + '44' }}
        >
          {loading
            ? <ActivityIndicator size="small" color={theme.accent} />
            : <Text style={[s.compactTxt, { color: theme.accent }]}>+ Open</Text>
          }
        </Pressable>
        <RecentModal visible={recentVisible} onClose={() => setRecentVisible(false)} theme={theme} />
      </>
    );
  }

  // ── Landing page ──────────────────────────────────────────────────────
  const { recents } = useRecent();

  return (
    <ScrollView
      contentContainerStyle={s.landing}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={s.hero}>
        <Image
          source={require('../../assets/icon.png')}
          style={s.heroImage}
          resizeMode="contain"
        />
        <Text style={[s.heroBy, { color: theme.border2, fontFamily: MONO }]}>
          by NightSky Studios
        </Text>
      </View>

      {/* Drop zone */}
      <Pressable
        style={({ pressed }) => [
          s.dropZone,
          { borderColor: pressed ? theme.accent : theme.border2 },
          pressed && { backgroundColor: theme.accent + '0a' },
        ]}
        onPress={pickFiles}
        android_ripple={{ color: theme.accent + '22' }}
      >
        {loading ? (
          <ActivityIndicator size="large" color={theme.accent} />
        ) : (
          <>
            <View style={[s.dropIcon, { backgroundColor: theme.accent + '18', borderColor: theme.accent + '44' }]}>
              <Text style={{ fontSize: 30 }}>🌌</Text>
            </View>
            <Text style={[s.dropTitle, { color: theme.text }]}>Open JSON File</Text>
            <Text style={[s.dropSub,   { color: theme.muted }]}>Tap to browse · any .json file</Text>
          </>
        )}
      </Pressable>

      {/* Feature pills */}
      <View style={s.pills}>
        {[
          { icon: '⊞', label: 'Table'  },
          { icon: '⇄', label: 'KV'     },
          { icon: '▾', label: 'Tree'   },
          { icon: '⌕', label: 'Search' },
          { icon: '{ }', label: 'Raw'    },
          { icon: '⎘', label: 'Copy'   },
        ].map((p) => (
          <View key={p.label} style={[s.pill, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[s.pillIcon, { color: theme.accent }]}>{p.icon}</Text>
            <Text style={[s.pillLabel, { color: theme.muted }]}>{p.label}</Text>
          </View>
        ))}
      </View>

      {/* Recents */}
      {recents.length > 0 && (
        <View style={[s.recentsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[s.recentsTitle, { color: theme.muted }]}>RECENTLY OPENED</Text>
          {recents.slice(0, 5).map((r, i) => (
            <View key={i} style={[s.recentRow, { borderTopColor: theme.border }]}>
              <Text style={[s.recentIcon, { color: theme.accent2 }]}>{ }</Text>
              <View style={s.recentInfo}>
                <Text style={[s.recentName, { color: theme.text, fontFamily: MONO }]} numberOfLines={1}>
                  {r.name}
                </Text>
                <Text style={[s.recentMeta, { color: theme.muted }]}>
                  {formatBytes(r.size)}  ·  {timeAgo(r.openedAt)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Swipe hint */}
      <Text style={[s.hint, { color: theme.border2 }]}>
        Hold "+ Open" to see file history
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  landing:   { padding: 24, gap: 20, alignItems: 'center', flexGrow: 1, justifyContent: 'center' },

  hero:      { alignItems: 'center', gap: 6 },
  heroImage: { width: 200, height: 200, borderRadius: 28 },
  heroBy:    { fontSize: 10, marginTop: -2 },

  dropZone: {
    width: '100%', maxWidth: 340, paddingVertical: 36, paddingHorizontal: 28,
    borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 20,
    alignItems: 'center', gap: 10,
  },
  dropIcon:  { width: 64, height: 64, borderRadius: 32, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dropTitle: { fontSize: 17, fontWeight: '700' },
  dropSub:   { fontSize: 12 },

  pills: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 8, width: '100%', maxWidth: 340,
  },
  pill:      { flexDirection: 'row', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  pillIcon:  { fontSize: 12 },
  pillLabel: { fontSize: 11, fontWeight: '600' },

  recentsCard:   { width: '100%', maxWidth: 340, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  recentsTitle:  { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, padding: 12, paddingBottom: 8 },
  recentRow:     { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, gap: 10 },
  recentIcon:    { fontSize: 16 },
  recentInfo:    { flex: 1 },
  recentName:    { fontSize: 12 },
  recentMeta:    { fontSize: 10, marginTop: 2 },

  hint:          { fontSize: 10, textAlign: 'center' },

  compactBtn:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  compactTxt:    { fontSize: 13, fontWeight: '700' },
  pressed:       { opacity: 0.65 },
});

const rm = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 24 },
  card:     { borderRadius: 16, borderWidth: 1, maxHeight: '70%', overflow: 'hidden' },
  header:   { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, gap: 10 },
  title:    { fontSize: 15, fontWeight: '700', flex: 1 },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  clearTxt: { fontSize: 11, fontWeight: '700' },
  close:    { fontSize: 16, padding: 4 },
  empty:    { padding: 32, alignItems: 'center' },
  emptyTxt: { fontStyle: 'italic', fontSize: 13 },
  list:     {},
  row:      { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, gap: 12 },
  fileIcon: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  info:     { flex: 1 },
  name:     { fontSize: 12 },
  meta:     { fontSize: 10, marginTop: 3 },
});
