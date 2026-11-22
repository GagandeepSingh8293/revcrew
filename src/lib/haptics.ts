import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'

export type HapticKind = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning'

export function triggerHaptic(kind: HapticKind = 'light') {
  if (Platform.OS === 'web') return
  try {
    switch (kind) {
      case 'selection':
        void Haptics.selectionAsync()
        break
      case 'medium':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        break
      case 'heavy':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        break
      case 'success':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        break
      case 'warning':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        break
      default:
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  } catch {
    // No-op on unsupported devices
  }
}
