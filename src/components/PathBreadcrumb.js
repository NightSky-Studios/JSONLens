import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../context/SettingsContext';

const MONO = Platform.select({ android: 'monospace', ios: 'Courier New' });

/**
 * PathBreadcrumb
 * path = ['records', 0, 'payment_gateways']
 * onNavigate(index) => go back to that depth
 */
export default function PathBreadcrumb({ path, onNavigate }) {
  const { theme } = useSettings();
  if (!path || path.length === 0) return null;

  const crumbs = ['root', ...path];

  return (
    <View style={[s.wrap, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.row}
      >
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <React.Fragment key={i}>
              <Pressable
                onPress={() => {
                  if (isLast) return;
                  Haptics.selectionAsync().catch(() => {});
                  onNavigate(i - 1); // -1 because root is index 0
                }}
                style={({ pressed }) => [s.crumb, pressed && !isLast && s.crumbPressed]}
                disabled={isLast}
              >
                <Text
                  style={[
                    s.crumbText,
                    { fontFamily: MONO },
                    isLast
                      ? { color: theme.accent, fontWeight: '700' }
                      : { color: theme.muted },
                  ]}
                  numberOfLines={1}
                >
                  {typeof crumb === 'number' ? `[${crumb}]` : String(crumb)}
                </Text>
              </Pressable>
              {!isLast && (
                <Text style={[s.sep, { color: theme.border2 }]}>›</Text>
              )}
            </React.Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:         { borderBottomWidth: 1 },
  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, gap: 4 },
  crumb:        { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  crumbPressed: { backgroundColor: 'rgba(255,255,255,0.07)' },
  crumbText:    { fontSize: 11 },
  sep:          { fontSize: 12, paddingHorizontal: 2 },
});
