/** Notificações locais da orla — via Service Worker (iOS PWA + Android/tablets). */

export type OrlaSpotKind = "marlin" | "golfinho" | "quiosque" | "rampa";

export type OrlaNotifyPayload = {
  title: string;
  body: string;
  tag: string;
  spot: string;
  kind: OrlaSpotKind;
  renotify?: boolean;
};

const PENDING_KEY = "pa_orla_pending_spot";

export function spotDeepLink(spot: string) {
  const url = new URL("/", typeof window !== "undefined" ? window.location.origin : "https://praia-alerta.vercel.app");
  url.searchParams.set("spot", spot);
  url.searchParams.set("map", "1");
  return `${url.pathname}${url.search}`;
}

export function readSpotFromLocation(search = typeof window !== "undefined" ? window.location.search : "") {
  try {
    let raw = search || "";
    if (raw.includes("?")) raw = raw.slice(raw.indexOf("?"));
    if (raw.startsWith("/")) raw = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
    if (raw && !raw.startsWith("?")) raw = `?${raw}`;
    const params = new URLSearchParams(raw);
    const spot = params.get("spot")?.trim();
    if (!spot) return null;
    return {
      spot,
      openMap: params.get("map") !== "0",
    };
  } catch {
    return null;
  }
}

/** Guarda o spot da notificação até a splash sair / o mapa montar. */
export function stashPendingSpot(spot: string | null | undefined) {
  if (typeof window === "undefined" || !spot) return;
  try {
    sessionStorage.setItem(PENDING_KEY, spot);
  } catch {
    /* private mode */
  }
}

export function takePendingSpot(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromUrl = readSpotFromLocation();
    const stashed = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    return fromUrl?.spot || stashed || null;
  } catch {
    /* ignore */
  }
  return null;
}

export function peekPendingSpot(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(PENDING_KEY) || readSpotFromLocation()?.spot || null;
  } catch {
    return readSpotFromLocation()?.spot || null;
  }
}

export function clearSpotFromUrl() {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("spot") && !url.searchParams.has("map")) return;
    url.searchParams.delete("spot");
    url.searchParams.delete("map");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {
    /* ignore */
  }
}

export async function ensureNotifyPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

function absoluteAsset(path: string) {
  if (typeof window === "undefined") return path;
  try {
    return new URL(path, window.location.origin).href;
  } catch {
    return path;
  }
}

function noticeOptions(payload: OrlaNotifyPayload, rich = true) {
  const path = spotDeepLink(payload.spot);
  const base = {
    body: payload.body,
    tag: payload.tag,
    lang: "pt-BR",
    dir: "ltr" as const,
    icon: absoluteAsset("/icons/icon-192.png?v=2"),
    badge: absoluteAsset("/icons/favicon-48.png?v=2"),
    data: {
      url: path,
      spot: payload.spot,
      kind: payload.kind,
    },
  };
  if (!rich) return base as NotificationOptions;
  // Campos extras: Android/Chrome gostam; iOS ignora o que não entende.
  return {
    ...base,
    renotify: payload.renotify ?? true,
    requireInteraction: false,
    silent: false,
    vibrate: [180, 80, 180],
  } as NotificationOptions;
}

async function viaServiceWorker(payload: OrlaNotifyPayload) {
  if (!("serviceWorker" in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    try {
      await reg.showNotification(payload.title, noticeOptions(payload, true));
      return true;
    } catch {
      // Alguns WebViews rejeitam vibrate/renotify — tenta o mínimo.
      await reg.showNotification(payload.title, noticeOptions(payload, false));
      return true;
    }
  } catch {
    return false;
  }
}

function viaPage(payload: OrlaNotifyPayload) {
  try {
    try {
      // eslint-disable-next-line no-new
      new Notification(payload.title, noticeOptions(payload, true));
      return true;
    } catch {
      // eslint-disable-next-line no-new
      new Notification(payload.title, noticeOptions(payload, false));
      return true;
    }
  } catch {
    return false;
  }
}

/** Dispara banner local. Prefere o SW (segundo plano / PWA iOS 16.4+ e Android). */
export async function pushOrlaNotice(payload: OrlaNotifyPayload) {
  if (typeof window === "undefined" || typeof Notification === "undefined") return false;
  if (Notification.permission !== "granted") {
    const permission = await ensureNotifyPermission();
    if (permission !== "granted") return false;
  }
  // Sempre tenta SW primeiro: no iOS o clique só chega de forma confiável assim.
  if (await viaServiceWorker(payload)) return true;
  return viaPage(payload);
}

export const MONUMENT_RADIUS_M = 200;
export const QUIOSQUE_RADIUS_M = 38;
export const RAMP_DWELL_MS = 3 * 60 * 1000;
export const EXIT_HYSTERESIS_M = 28;

/** Em teste (?rampDwellMs=800) o corredor avisa mais rápido. */
export function rampDwellMs() {
  if (typeof window === "undefined") return RAMP_DWELL_MS;
  try {
    const raw = new URLSearchParams(window.location.search).get("rampDwellMs");
    const value = raw ? Number(raw) : NaN;
    if (Number.isFinite(value) && value >= 200 && value <= RAMP_DWELL_MS) return value;
  } catch {
    /* ignore */
  }
  return RAMP_DWELL_MS;
}

/** Id de quiosque no mapa (q1…qN) — evita colidir com "quadra-areia". */
export function isQuiosqueSpotId(spot: string) {
  return /^q\d+$/i.test(spot.trim());
}
