import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { storageGet, storageRemove, storageSet } from "../utils/storage";

export type OrlaSpotKind = "marlin" | "golfinho" | "quiosque" | "rampa" | "ducha";

export type OrlaNotifyPayload = {
  title: string;
  body: string;
  tag: string;
  spot: string;
  kind: OrlaSpotKind;
  renotify?: boolean;
};

const PENDING_KEY = "pa_orla_pending_spot";

export const NOTIFY_SOFT_KEY = "pa_notify_soft_prompt_v1";
export type NotifySoftChoice = "unset" | "accepted" | "declined";

export async function readNotifySoftChoice(): Promise<NotifySoftChoice> {
  const raw = await storageGet(NOTIFY_SOFT_KEY);
  if (raw === "accepted" || raw === "declined") return raw;
  return "unset";
}

export async function writeNotifySoftChoice(choice: Exclude<NotifySoftChoice, "unset">) {
  await storageSet(NOTIFY_SOFT_KEY, choice);
}

export async function stashPendingSpot(spot: string | null | undefined) {
  if (!spot) return;
  await storageSet(PENDING_KEY, spot);
}

export async function takePendingSpot(): Promise<string | null> {
  const spot = await storageGet(PENDING_KEY);
  await storageRemove(PENDING_KEY);
  return spot;
}

export async function peekPendingSpot(): Promise<string | null> {
  return storageGet(PENDING_KEY);
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNativeNotifyPermission(): Promise<boolean> {
  const soft = await readNotifySoftChoice();
  if (soft === "declined") return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("orla", {
      name: "Avisos da orla",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [180, 80, 180],
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** Push local nativo — paridade com SW do PWA. */
export async function pushOrlaNotice(payload: OrlaNotifyPayload): Promise<boolean> {
  const soft = await readNotifySoftChoice();
  if (soft !== "accepted") return false;
  const ok = await requestNativeNotifyPermission();
  if (!ok) return false;
  await stashPendingSpot(payload.spot);
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: { spot: payload.spot, kind: payload.kind, tag: payload.tag },
        sound: true,
      },
      trigger: null,
    });
    return true;
  } catch {
    return false;
  }
}

export const ORLA_RADII = {
  marlin: 200,
  golfinho: 200,
  ducha: 42,
  quiosque: 58,
  rampaDwellMs: 3 * 60_000,
} as const;
