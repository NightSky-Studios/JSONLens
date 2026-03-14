import React, {
  createContext, useContext, useState, useRef, useCallback,
} from 'react';
import {
  View, Text, Animated, StyleSheet, Dimensions, Platform,
} from 'react-native';
import { useSettings } from './SettingsContext';

const ToastContext = createContext(null);

const { width: SW } = Dimensions.get('window');

const ICONS = {
  success: '✓',
  error:   '✕',
  copy:    '⎘',
  info:    'ℹ',
};

export function ToastProvider({ children }) {
  const { theme } = useSettings();
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const showToast = useCallback(({ message, type = 'info', duration = 2000 }) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={s.container} pointerEvents="none">
        {toasts.map((t, i) => (
          <ToastItem key={t.id} toast={t} index={i} theme={theme} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, theme }) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity,    { toValue: 1, damping: 18, stiffness: 200, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, damping: 18, stiffness: 200, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -10, duration: 250, useNativeDriver: true }),
      ]).start();
    }, 1600);
    return () => clearTimeout(t);
  }, []);

  const colors = {
    success: theme.accent,
    error:   theme.accent3,
    copy:    theme.accent2,
    info:    theme.warn,
  };
  const col = colors[toast.type] ?? theme.accent;

  return (
    <Animated.View
      style={[
        s.toast,
        {
          backgroundColor: theme.card,
          borderColor: col + '66',
          shadowColor: col,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={[s.iconDot, { backgroundColor: col + '33', borderColor: col + '66' }]}>
        <Text style={[s.icon, { color: col }]}>{ICONS[toast.type] ?? ICONS.info}</Text>
      </View>
      <Text style={[s.message, { color: theme.text }]} numberOfLines={2}>{toast.message}</Text>
    </Animated.View>
  );
}

export const useToast = () => useContext(ToastContext);

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 32 : 48,
    left: 0, right: 0,
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: SW - 48,
    minWidth: 160,
    elevation: 8,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  iconDot: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  icon:    { fontSize: 12, fontWeight: '700' },
  message: { fontSize: 13, fontWeight: '500', flex: 1 },
});
