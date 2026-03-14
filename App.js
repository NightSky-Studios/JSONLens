import React, {
  useState, useCallback, useRef, useEffect,
} from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  StatusBar, Platform, PanResponder, Animated,
  KeyboardAvoidingView, Dimensions, Image,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { ToastProvider }   from './src/context/ToastContext';
import { RecentProvider, useRecent } from './src/context/RecentContext';

import NightSkyBackground from './src/components/NightSkyBackground';
import FileTab            from './src/components/FileTab';
import FilePicker         from './src/components/FilePicker';
import SettingsModal      from './src/components/SettingsModal';

const { width: SW } = Dimensions.get('window');

// ── Animated tab slide ──────────────────────────────────────────────────────
function useTabSlide() {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const slide = useCallback((direction) => {
    const from = direction === 'left' ? -SW * 0.12 : SW * 0.12;
    slideAnim.setValue(from);
    Animated.spring(slideAnim, {
      toValue: 0,
      damping: 22,
      stiffness: 260,
      useNativeDriver: true,
    }).start();
  }, []);
  return { slideAnim, slide };
}

// ── Inner app ───────────────────────────────────────────────────────────────
function Inner() {
  const { theme } = useSettings();
  const { pushRecent } = useRecent();
  const insets = useSafeAreaInsets();

  const [files,    setFiles]    = useState([]);
  const [active,   setActive]   = useState(null);
  const [settings, setSettings] = useState(false);

  const { slideAnim, slide } = useTabSlide();
  const swipeAnim = useRef(new Animated.Value(0)).current;

  // ── File management ────────────────────────────────────────────────────
  const addFile = useCallback((file) => {
    setFiles((prev) => {
      const exists = prev.find((f) => f.name === file.name);
      if (exists) return prev.map((f) => f.name === file.name ? file : f);
      return [...prev, file];
    });
    setActive(file.id);
    // Track size for recents display
    const size = JSON.stringify(file.data).length;
    pushRecent(file.name, size);
    slide('right');
  }, [pushRecent, slide]);

  const removeFile = useCallback((id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (active === id) setActive(next[next.length - 1]?.id ?? null);
      return next;
    });
  }, [active]);

  const switchTab = useCallback((id, direction = 'right') => {
    if (id === active) return;
    Haptics.selectionAsync().catch(() => {});
    setActive(id);
    slide(direction);
  }, [active, slide]);

  // ── Swipe between tabs ────────────────────────────────────────────────
  const filesRef = useRef(files);
  const activeRef = useRef(active);
  useEffect(() => { filesRef.current  = files;  }, [files]);
  useEffect(() => { activeRef.current = active; }, [active]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 1.8,

      onPanResponderMove: (_, g) => {
        if (filesRef.current.length < 2) return;
        swipeAnim.setValue(g.dx * 0.25);
      },

      onPanResponderRelease: (_, g) => {
        if (filesRef.current.length < 2) {
          Animated.spring(swipeAnim, { toValue: 0, useNativeDriver: true }).start();
          return;
        }
        const THRESHOLD = 55;
        if (Math.abs(g.dx) < THRESHOLD) {
          Animated.spring(swipeAnim, { toValue: 0, damping: 18, useNativeDriver: true }).start();
          return;
        }
        const curFiles  = filesRef.current;
        const curActive = activeRef.current;
        const idx  = curFiles.findIndex((f) => f.id === curActive);
        const next = g.dx < 0
          ? curFiles[Math.min(idx + 1, curFiles.length - 1)]
          : curFiles[Math.max(idx - 1, 0)];

        Animated.spring(swipeAnim, { toValue: 0, damping: 18, useNativeDriver: true }).start();
        if (next && next.id !== curActive) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          switchTab(next.id, g.dx < 0 ? 'left' : 'right');
        }
      },
    })
  ).current;

  const activeFile = files.find((f) => f.id === active);
  const activeIdx  = files.findIndex((f) => f.id === active);

  return (
    <View style={[s.root, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Night sky layer */}
      <NightSkyBackground />

      <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
        {/* ── Top bar ── */}
        <View style={[s.topbar, { backgroundColor: theme.surface + 'f2', borderBottomColor: theme.border }]}>
          {/* Logo */}
          <Image
            source={require('./assets/icon.png')}
            style={s.topbarLogo}
            resizeMode="contain"
          />

          {/* File count */}
          {files.length > 0 && (
            <View style={[s.countBadge, { backgroundColor: theme.card, borderColor: theme.border2 }]}>
              <Text style={[s.countTxt, { color: theme.muted }]}>
                {files.length} open
              </Text>
            </View>
          )}

          {/* Tab position indicator */}
          {files.length > 1 && (
            <View style={[s.tabPos, { backgroundColor: theme.card, borderColor: theme.border2 }]}>
              <Text style={[s.tabPosTxt, { color: theme.accent }]}>
                {activeIdx + 1}/{files.length}
              </Text>
            </View>
          )}

          <View style={s.topSpacer} />

          {/* Open file button */}
          <FilePicker onFiles={addFile} compact />

          {/* Settings button */}
          <Pressable
            style={({ pressed }) => [
              s.iconBtn,
              { borderColor: theme.border2 },
              pressed && s.pressed,
            ]}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); setSettings(true); }}
            android_ripple={{ color: theme.accent + '33', radius: 22, borderless: true }}
            hitSlop={10}
          >
            <Text style={[s.iconBtnTxt, { color: theme.muted }]}>⚙</Text>
          </Pressable>
        </View>

        {/* ── Tab bar ── */}
        {files.length > 0 && (
          <View style={[s.tabBarOuter, { backgroundColor: theme.surface + 'f2', borderBottomColor: theme.border }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.tabBarInner}
            >
              {files.map((f, fi) => {
                const isActive = f.id === active;
                return (
                  <Pressable
                    key={f.id}
                    style={[
                      s.tab,
                      { borderBottomColor: isActive ? theme.accent : 'transparent' },
                    ]}
                    onPress={() => switchTab(f.id, fi > activeIdx ? 'left' : 'right')}
                    android_ripple={{ color: theme.accent + '22' }}
                  >
                    {isActive && (
                      <View
                        style={[
                          StyleSheet.absoluteFillObject,
                          { backgroundColor: theme.accent + '14', borderRadius: 2 },
                        ]}
                      />
                    )}
                    {/* Error dot */}
                    {f.data?.error && (
                      <View style={[s.errorDot, { backgroundColor: theme.accent3 }]} />
                    )}
                    <Text
                      style={[s.tabTxt, { color: isActive ? theme.text : theme.muted }]}
                      numberOfLines={1}
                    >
                      {f.name}
                    </Text>
                    <Pressable
                      onPress={() => removeFile(f.id)}
                      hitSlop={10}
                      style={s.tabCloseWrap}
                      android_ripple={{ color: theme.accent3 + '66', radius: 12, borderless: true }}
                    >
                      <Text style={[s.tabCloseTxt, { color: isActive ? theme.muted : theme.border2 }]}>✕</Text>
                    </Pressable>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Swipe indicator dots */}
            {files.length > 1 && (
              <View style={s.dotWrap}>
                {files.map((f) => (
                  <View
                    key={f.id}
                    style={[
                      s.dot,
                      {
                        backgroundColor: f.id === active ? theme.accent : theme.border2,
                        width: f.id === active ? 14 : 5,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </SafeAreaView>

      {/* ── Content ── */}
      <KeyboardAvoidingView
        style={s.kavWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <Animated.View
          style={[
            s.contentWrap,
            { transform: [{ translateX: swipeAnim }, { translateX: slideAnim }] },
          ]}
          {...panResponder.panHandlers}
        >
          {files.length === 0 ? (
            <FilePicker onFiles={addFile} />
          ) : activeFile ? (
            <FileTab key={activeFile.id} file={activeFile} />
          ) : (
            <View style={s.emptyState}>
              <Text style={[s.emptyTxt, { color: theme.muted }]}>Select a tab</Text>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Bottom safe area fill */}
      <View style={{ height: insets.bottom, backgroundColor: theme.bg }} />

      {/* Settings sheet */}
      <SettingsModal visible={settings} onClose={() => setSettings(false)} />
    </View>
  );
}

// ── Root ────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <RecentProvider>
            <ToastProvider>
              <Inner />
            </ToastProvider>
          </RecentProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1 },
  safe:  { zIndex: 2 },

  topbar: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, paddingHorizontal: 14, gap: 8,
    borderBottomWidth: 1,
  },
  topbarLogo:   { width: 80, height: 36, borderRadius: 6 },

  countBadge:{ borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  countTxt:  { fontSize: 10, fontWeight: '600' },
  tabPos:    { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  tabPosTxt: { fontSize: 10, fontWeight: '700' },
  topSpacer: { flex: 1 },
  iconBtn:   { padding: 8, borderRadius: 10, borderWidth: 1 },
  iconBtnTxt:{ fontSize: 16 },
  pressed:   { opacity: 0.55 },

  tabBarOuter: {
    flexDirection: 'row', borderBottomWidth: 1,
    alignItems: 'center', maxHeight: 46,
  },
  tabBarInner: { paddingHorizontal: 6, gap: 2, alignItems: 'stretch' },
  tab: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 8, gap: 7,
    borderBottomWidth: 2, maxWidth: 190,
    position: 'relative', overflow: 'hidden',
    borderRadius: 2,
  },
  errorDot:    { width: 6, height: 6, borderRadius: 3, marginRight: -2 },
  tabTxt:      { fontSize: 12, flexShrink: 1, fontWeight: '500' },
  tabCloseWrap:{ padding: 2, borderRadius: 10 },
  tabCloseTxt: { fontSize: 10 },

  dotWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, flexShrink: 0,
  },
  dot: { height: 5, borderRadius: 3 },

  kavWrap:     { flex: 1 },
  contentWrap: { flex: 1 },
  emptyState:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTxt:    { fontSize: 14 },
});
