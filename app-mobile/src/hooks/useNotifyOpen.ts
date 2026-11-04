import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { stashPendingSpot } from "../data/orla-notify";

/** Toque na notificação → abre o spot no mapa (paridade com SW notificationclick). */
export function useNotifyOpen(onSpot: (spot: string) => void) {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { spot?: string };
      if (data?.spot) {
        void stashPendingSpot(data.spot);
        onSpot(data.spot);
      }
    });
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      const data = response?.notification.request.content.data as { spot?: string } | undefined;
      if (data?.spot) {
        void stashPendingSpot(data.spot);
        onSpot(data.spot);
      }
    });
    return () => sub.remove();
  }, [onSpot]);
}
