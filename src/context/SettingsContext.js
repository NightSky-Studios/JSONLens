import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildTheme } from '../theme';

const SettingsContext = createContext(null);
const STORAGE_KEY = 'json_lens_settings_v2';

export const FONT_SIZES = [
  { id: 'sm', label: 'Small',  mono: 10, ui: 11 },
  { id: 'md', label: 'Medium', mono: 12, ui: 13 },
  { id: 'lg', label: 'Large',  mono: 14, ui: 15 },
];

export function SettingsProvider({ children }) {
  const [darkMode,  setDarkModeState]  = useState(true);
  const [accentId,  setAccentIdState]  = useState('nebula');
  const [fontSizeId,setFontSizeState]  = useState('md');
  const [loaded,    setLoaded]         = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.darkMode   !== undefined) setDarkModeState(saved.darkMode);
          if (saved.accentId   !== undefined) setAccentIdState(saved.accentId);
          if (saved.fontSizeId !== undefined) setFontSizeState(saved.fontSizeId);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const persist = (patch) =>
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ darkMode, accentId, fontSizeId, ...patch })).catch(() => {});

  const setDarkMode  = (v) => { setDarkModeState(v);  persist({ accentId,  fontSizeId, darkMode:   v }); };
  const setAccentId  = (v) => { setAccentIdState(v);  persist({ darkMode,  fontSizeId, accentId:   v }); };
  const setFontSizeId= (v) => { setFontSizeState(v);  persist({ darkMode,  accentId,   fontSizeId: v }); };

  const theme    = buildTheme(accentId, darkMode);
  const fontSize = FONT_SIZES.find((f) => f.id === fontSizeId) ?? FONT_SIZES[1];

  return (
    <SettingsContext.Provider value={{ theme, darkMode, setDarkMode, accentId, setAccentId, fontSizeId, setFontSizeId, fontSize, loaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
