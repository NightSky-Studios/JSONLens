import * as Clipboard from 'expo-clipboard';
import * as Haptics   from 'expo-haptics';
import { useToast }   from '../context/ToastContext';

export default function useCopy() {
  const { showToast } = useToast();

  const copy = async (value, label) => {
    try {
      const text = typeof value === 'string' ? value
        : typeof value === 'object' ? JSON.stringify(value, null, 2)
        : String(value);

      await Clipboard.setStringAsync(text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      showToast({ message: label ? `Copied: ${label}` : 'Copied to clipboard', type: 'copy', duration: 1800 });
    } catch {
      showToast({ message: 'Copy failed', type: 'error' });
    }
  };

  return copy;
}
