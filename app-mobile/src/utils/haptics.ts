import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * Pulso ao completar Emergência.
 * iOS: UIImpact / notification (nativo de verdade).
 * Android: impact + Vibration API via Haptics.
 */
export async function pulseEmergency() {
  try {
    if (Platform.OS === "ios") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    /* emulador sem motor */
  }
}

export async function pulseSoft() {
  try {
    await Haptics.selectionAsync();
  } catch {
    /* ignore */
  }
}
