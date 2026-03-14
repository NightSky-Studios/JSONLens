import { Platform } from 'react-native';

// ── Accent colour themes ────────────────────────────────────────────────────
export const ACCENT_THEMES = [
  { id: 'nebula',  label: 'Nebula',  color: '#b87fff' },
  { id: 'aurora',  label: 'Aurora',  color: '#6dffb3' },
  { id: 'stellar', label: 'Stellar', color: '#4fa8ff' },
  { id: 'nova',    label: 'Nova',    color: '#ff6d9d' },
  { id: 'solar',   label: 'Solar',   color: '#ffd06d' },
];

export function buildTheme(accentId = 'nebula', darkMode = true) {
  const accentEntry = ACCENT_THEMES.find((t) => t.id === accentId) ?? ACCENT_THEMES[0];
  const accent = accentEntry.color;

  if (darkMode) {
    return {
      bg:          '#080610',
      surface:     '#0f0b1c',
      card:        '#160f28',
      border:      '#1e1535',
      border2:     '#2a1d4a',
      text:        '#e8e0ff',
      muted:       '#7a6d9e',
      accent,
      accent2:     '#4fa8ff',
      accent3:     '#ff6d9d',
      warn:        '#ffd06d',
      isDark:      true,
      starOpacity: 0.85,
    };
  } else {
    return {
      bg:          '#f0ecff',
      surface:     '#e8e2f8',
      card:        '#ddd5f5',
      border:      '#c9bfee',
      border2:     '#b8aae6',
      text:        '#1a1030',
      muted:       '#6b5f8e',
      accent,
      accent2:     '#2a7ce0',
      accent3:     '#d63e7f',
      warn:        '#b87800',
      isDark:      false,
      starOpacity: 0.25,
    };
  }
}

export const theme = buildTheme('nebula', true);

export const fonts = {
  mono: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  ui:   Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
};
