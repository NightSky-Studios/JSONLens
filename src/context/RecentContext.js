import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RecentContext = createContext(null);
const KEY = 'json_lens_recent_v1';
const MAX = 10;

export function RecentProvider({ children }) {
  const [recents, setRecents] = useState([]); // [{ name, size, openedAt }]

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setRecents(JSON.parse(raw)))
      .catch(() => {});
  }, []);

  const pushRecent = useCallback((name, size) => {
    setRecents((prev) => {
      const entry = { name, size, openedAt: Date.now() };
      const filtered = prev.filter((r) => r.name !== name);
      const next = [entry, ...filtered].slice(0, MAX);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecents([]);
    AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);

  return (
    <RecentContext.Provider value={{ recents, pushRecent, clearRecents }}>
      {children}
    </RecentContext.Provider>
  );
}

export const useRecent = () => useContext(RecentContext);
