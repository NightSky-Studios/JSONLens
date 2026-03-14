import React, { useRef } from 'react';
import {
  View, Text, Modal, Pressable, Switch, StyleSheet,
  ScrollView, Animated, Linking, Platform, Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSettings }          from '../context/SettingsContext';
import { ACCENT_THEMES }        from '../theme';
import { FONT_SIZES }           from '../context/SettingsContext';

const DEV_URL = 'https://github.com/NightSky-Studios';

export default function SettingsModal({ visible, onClose }) {
  const { theme, darkMode, setDarkMode, accentId, setAccentId, fontSizeId, setFontSizeId } = useSettings();
  const slideAnim = useRef(new Animated.Value(400)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, damping: 20, stiffness: 200, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible]);

  const hapticLight  = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  const hapticMedium = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

  const selectAccent   = (id) => { if (id !== accentId)   { hapticMedium(); setAccentId(id);   } };
  const selectFontSize = (id) => { if (id !== fontSizeId) { hapticLight();  setFontSizeId(id); } };

  const openDev = async () => {
    hapticLight();
    try { await Linking.openURL(DEV_URL); } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={[s.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]} onPress={onClose}>
        <Animated.View
          style={[s.sheet, { backgroundColor: theme.surface, borderColor: theme.border2, transform: [{ translateY: slideAnim }] }]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <View style={[s.handle, { backgroundColor: theme.border2 }]} />

          <View style={[s.header, { borderBottomColor: theme.border }]}>
            <Text style={[s.headerTitle, { color: theme.text }]}>Settings</Text>
            <Pressable
              onPress={() => { hapticLight(); onClose(); }}
              style={({ pressed }) => [s.closeBtn, pressed && s.pressed]}
              android_ripple={{ color: theme.border2, radius: 20 }}
            >
              <Text style={[s.closeTxt, { color: theme.muted }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

            {/* ── Appearance ── */}
            <Section title="APPEARANCE" theme={theme}>
              <View style={[s.row, { borderBottomColor: theme.border }]}>
                <View style={s.rowLeft}>
                  <Text style={[s.rowTitle, { color: theme.text }]}>Dark Mode</Text>
                  <Text style={[s.rowSub,   { color: theme.muted }]}>Night sky background</Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={(v) => { hapticLight(); setDarkMode(v); }}
                  trackColor={{ false: theme.border2, true: theme.accent + '66' }}
                  thumbColor={darkMode ? theme.accent : theme.muted}
                />
              </View>

              {/* Font size */}
              <View style={[s.row, { borderBottomColor: 'transparent' }]}>
                <View style={s.rowLeft}>
                  <Text style={[s.rowTitle, { color: theme.text }]}>Font Size</Text>
                  <Text style={[s.rowSub,   { color: theme.muted }]}>Code & UI text size</Text>
                </View>
                <View style={s.fontBtns}>
                  {FONT_SIZES.map((f) => {
                    const active = fontSizeId === f.id;
                    return (
                      <Pressable
                        key={f.id}
                        onPress={() => selectFontSize(f.id)}
                        style={[s.fontBtn, { borderColor: active ? theme.accent : theme.border2 }, active && { backgroundColor: theme.card }]}
                        android_ripple={{ color: theme.accent + '44' }}
                      >
                        <Text style={[s.fontBtnTxt, { color: active ? theme.accent : theme.muted, fontSize: f.id === 'sm' ? 11 : f.id === 'md' ? 13 : 15 }]}>A</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </Section>

            {/* ── Colour Theme ── */}
            <Section title="COLOUR THEME" theme={theme}>
              <View style={s.accentGrid}>
                {ACCENT_THEMES.map((t) => {
                  const active = accentId === t.id;
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => selectAccent(t.id)}
                      style={({ pressed }) => [s.accentItem, pressed && s.pressed]}
                      android_ripple={{ color: t.color + '44', radius: 40, borderless: true }}
                    >
                      <View style={[
                        s.accentSwatch,
                        { backgroundColor: t.color, borderColor: active ? t.color : theme.border2, borderWidth: active ? 3 : 1 },
                        active && { shadowColor: t.color, shadowOpacity: 0.9, shadowRadius: 10, elevation: 8 },
                      ]} />
                      <Text style={[s.accentLabel, { color: active ? t.color : theme.muted }]}>{t.label}</Text>
                      {active && <Text style={[s.accentCheck, { color: t.color }]}>✓</Text>}
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            {/* ── About ── */}
            <Section title="ABOUT" theme={theme}>
              <Pressable
                onPress={openDev}
                style={({ pressed }) => [s.devCard, { backgroundColor: theme.card, borderColor: theme.border2 }, pressed && s.pressed]}
                android_ripple={{ color: theme.accent + '22' }}
              >
                <View style={s.devTop}>
                  <View style={[s.devOrb, { backgroundColor: theme.accent + '22', borderColor: theme.accent + '55' }]}>
                    <Image
                      source={require('../../assets/studio-logo.png')}
                      style={s.devLogoImg}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={s.devInfo}>
                    <Text style={[s.devName, { color: theme.text }]}>NightSky Studios</Text>
                    <Text style={[s.devYear, { color: theme.muted }]}>© 2026  ·  All rights reserved</Text>
                  </View>
                  <View style={[s.devBadge, { borderColor: theme.accent + '44', backgroundColor: theme.accent + '11' }]}>
                    <Text style={[s.devBadgeTxt, { color: theme.accent }]}>GitHub ↗</Text>
                  </View>
                </View>
                <Text style={[s.devUrl, { color: theme.muted }]}>github.com/NightSky-Studios</Text>
              </Pressable>
              <View style={[s.appInfoRow, { borderTopColor: theme.border }]}>
                <Text style={[s.appInfoTxt, { color: theme.muted }]}>JSON Lens  ·  v1.0.0</Text>
                <Text style={[s.appInfoTxt, { color: theme.muted }]}>Expo SDK 52</Text>
              </View>
            </Section>

          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function Section({ title, theme, children }) {
  return (
    <View style={s.section}>
      <Text style={[s.sectionTitle, { color: theme.muted }]}>{title}</Text>
      <View style={[s.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {children}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderBottomWidth: 0,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'android' ? 28 : 40,
  },
  handle:      { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  closeBtn:    { padding: 6, borderRadius: 16 },
  closeTxt:    { fontSize: 16 },
  pressed:     { opacity: 0.65 },
  body:        { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, gap: 8 },
  section:     { marginBottom: 16 },
  sectionTitle:{ fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  sectionCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  row:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1 },
  rowLeft:     { flex: 1, gap: 2 },
  rowTitle:    { fontSize: 14, fontWeight: '600' },
  rowSub:      { fontSize: 11 },
  fontBtns:    { flexDirection: 'row', gap: 6 },
  fontBtn:     { width: 36, height: 36, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  fontBtnTxt:  { fontWeight: '700' },
  accentGrid:  { flexDirection: 'row', justifyContent: 'space-around', padding: 16 },
  accentItem:  { alignItems: 'center', gap: 6, padding: 4 },
  accentSwatch:{ width: 42, height: 42, borderRadius: 21 },
  accentLabel: { fontSize: 10, fontWeight: '600' },
  accentCheck: { fontSize: 10, fontWeight: '900' },
  devCard:     { padding: 14, borderRadius: 12, borderWidth: 1, margin: 6, gap: 8 },
  devTop:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  devOrb:      { width: 52, height: 52, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  devLogoImg:  { width: 48, height: 48 },
  devInfo:     { flex: 1, gap: 2 },
  devName:     { fontSize: 15, fontWeight: '700' },
  devYear:     { fontSize: 11 },
  devBadge:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  devBadgeTxt: { fontSize: 12, fontWeight: '700' },
  devUrl:      { fontSize: 11, fontFamily: Platform.select({ android: 'monospace', ios: 'Courier New' }) },
  appInfoRow:  { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderTopWidth: 1 },
  appInfoTxt:  { fontSize: 10 },
});
