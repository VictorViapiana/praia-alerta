import { storageGet, storageSet } from "../utils/storage";
import { AMBULANTES, type Ambulante } from "./places";

/** Conta do ambulante (login local + sessão). */
export type AmbulanteAccount = {
  id: string;
  phone: string;
  pin: string;
  name: string;
  tag: string;
  /** Liga a um id do catálogo (milho, picole…) ou id próprio. */
  catalogId: string;
  walks: boolean;
  whatsapp: string;
  createdAt: number;
};

/** Presença ao vivo na areia — só online aparece no mapa. */
export type AmbulantePresence = {
  id: string;
  catalogId: string;
  name: string;
  tag: string;
  online: boolean;
  walks: boolean;
  lat: number;
  lng: number;
  whatsapp: string;
  updatedAt: number;
};

export type AmbulanteSession = {
  accountId: string;
  catalogId: string;
  name: string;
};

const ACCOUNTS_KEY = "pa_ambulante_accounts_v1";
const SESSION_KEY = "pa_ambulante_session_v1";
const PRESENCE_KEY = "pa_ambulante_presence_v1";
const HUB_URL = process.env.EXPO_PUBLIC_AMBULANTE_HUB_URL?.trim() || "";

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

export function subscribeAmbulanteHub(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function digits(v: string) {
  return v.replace(/\D/g, "");
}

export function giftCodeFor(id: string) {
  return `AREIA-${id.slice(0, 4).toUpperCase()}`;
}

async function readAccounts(): Promise<AmbulanteAccount[]> {
  const raw = await storageGet(ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as AmbulanteAccount[]) : [];
  } catch {
    return [];
  }
}

async function writeAccounts(list: AmbulanteAccount[]) {
  await storageSet(ACCOUNTS_KEY, JSON.stringify(list));
}

export async function readSession(): Promise<AmbulanteSession | null> {
  const raw = await storageGet(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AmbulanteSession;
  } catch {
    return null;
  }
}

async function writeSession(session: AmbulanteSession | null) {
  if (!session) {
    await storageSet(SESSION_KEY, "");
    return;
  }
  await storageSet(SESSION_KEY, JSON.stringify(session));
}

export async function readPresenceMap(): Promise<Record<string, AmbulantePresence>> {
  const raw = await storageGet(PRESENCE_KEY);
  let local: Record<string, AmbulantePresence> = {};
  if (raw) {
    try {
      local = JSON.parse(raw) as Record<string, AmbulantePresence>;
    } catch {
      local = {};
    }
  }

  if (HUB_URL) {
    try {
      const res = await fetch(`${HUB_URL.replace(/\/$/, "")}/presence`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const remote = (await res.json()) as Record<string, AmbulantePresence>;
        local = { ...local, ...remote };
      }
    } catch {
      /* hub offline — usa local */
    }
  }
  return local;
}

async function writePresenceMap(map: Record<string, AmbulantePresence>) {
  await storageSet(PRESENCE_KEY, JSON.stringify(map));
  if (HUB_URL) {
    try {
      await fetch(`${HUB_URL.replace(/\/$/, "")}/presence`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(map),
      });
    } catch {
      /* sync best-effort */
    }
  }
  emit();
}

/** Catálogo + overrides de presença. Offline some do mapa. */
export function mergeLiveAmbulantes(
  presence: Record<string, AmbulantePresence>,
  now = Date.now(),
): Ambulante[] {
  const STALE_MS = 12 * 60_000;
  const byId = new Map<string, Ambulante>();

  for (const base of AMBULANTES) {
    const live = presence[base.id];
    if (live) {
      const fresh = live.online && now - live.updatedAt < STALE_MS;
      if (!fresh) continue;
      byId.set(base.id, {
        ...base,
        isOnline: true,
        name: live.name || base.name,
        tag: live.tag || base.tag,
        walks: live.walks,
        lat: live.lat,
        lng: live.lng,
        hours: "Na areia agora",
        whatsapp: live.whatsapp || base.whatsapp,
      });
    } else if (base.isSponsor && base.isOnline) {
      // Sem controle ao vivo ainda — mantém pin do catálogo (beta).
      byId.set(base.id, base);
    }
  }

  for (const live of Object.values(presence)) {
    if (byId.has(live.catalogId) || byId.has(live.id)) continue;
    if (!live.online || now - live.updatedAt >= STALE_MS) continue;
    byId.set(live.id, {
      id: live.id,
      name: live.name,
      tag: live.tag,
      isSponsor: true,
      isOnline: true,
      walks: live.walks,
      lat: live.lat,
      lng: live.lng,
      hours: "Na areia agora",
      cover: "/guarapari/praia-verao.jpg",
      about: `${live.name} na areia da Praia do Morro — ao vivo pelo Praia Alerta Guará.`,
      menu: [{ name: "Peça na areia", price: "Sob consulta", photo: "/guarapari/praia-orla.jpg" }],
      whatsapp: live.whatsapp || "Chamar no WhatsApp",
    });
  }

  return Array.from(byId.values());
}

export async function registerAmbulante(input: {
  name: string;
  tag: string;
  phone: string;
  pin: string;
  catalogId?: string;
  walks?: boolean;
}): Promise<{ ok: true; account: AmbulanteAccount } | { ok: false; error: string }> {
  const phone = digits(input.phone);
  const pin = digits(input.pin);
  if (input.name.trim().length < 2) return { ok: false, error: "Informe o nome do carrinho." };
  if (phone.length < 10) return { ok: false, error: "Telefone inválido (DDD + número)." };
  if (pin.length < 4 || pin.length > 6) return { ok: false, error: "PIN de 4 a 6 dígitos." };

  const accounts = await readAccounts();
  if (accounts.some((a) => a.phone === phone)) {
    return { ok: false, error: "Este telefone já tem conta. Faça login." };
  }

  const catalogId =
    input.catalogId && AMBULANTES.some((v) => v.id === input.catalogId)
      ? input.catalogId
      : `live-${phone.slice(-6)}`;

  if (accounts.some((a) => a.catalogId === catalogId && catalogId.startsWith("live-") === false)) {
    return { ok: false, error: "Este carrinho do catálogo já tem dono neste aparelho." };
  }

  const catalog = AMBULANTES.find((v) => v.id === catalogId);
  const account: AmbulanteAccount = {
    id: `acc-${phone}`,
    phone,
    pin,
    name: input.name.trim(),
    tag: (input.tag || catalog?.tag || "Na areia").trim(),
    catalogId,
    walks: input.walks ?? catalog?.walks ?? true,
    whatsapp: phone,
    createdAt: Date.now(),
  };
  accounts.push(account);
  await writeAccounts(accounts);
  await writeSession({ accountId: account.id, catalogId: account.catalogId, name: account.name });
  emit();
  return { ok: true, account };
}

export async function loginAmbulante(
  phoneRaw: string,
  pinRaw: string,
): Promise<{ ok: true; account: AmbulanteAccount } | { ok: false; error: string }> {
  const phone = digits(phoneRaw);
  const pin = digits(pinRaw);
  const accounts = await readAccounts();
  const account = accounts.find((a) => a.phone === phone && a.pin === pin);
  if (!account) return { ok: false, error: "Telefone ou PIN incorretos." };
  await writeSession({ accountId: account.id, catalogId: account.catalogId, name: account.name });
  emit();
  return { ok: true, account };
}

export async function logoutAmbulante() {
  const session = await readSession();
  if (session) {
    await setAmbulanteOnline(false);
  }
  await writeSession(null);
  emit();
}

export async function getLoggedAccount(): Promise<AmbulanteAccount | null> {
  const session = await readSession();
  if (!session) return null;
  const accounts = await readAccounts();
  return accounts.find((a) => a.id === session.accountId) ?? null;
}

export async function setAmbulanteOnline(
  online: boolean,
  coords?: { lat: number; lng: number },
): Promise<AmbulantePresence | null> {
  const account = await getLoggedAccount();
  if (!account) return null;

  const map = await readPresenceMap();
  const catalog = AMBULANTES.find((v) => v.id === account.catalogId);
  const prev = map[account.catalogId] ?? map[account.id];
  const lat = coords?.lat ?? prev?.lat ?? catalog?.lat ?? -20.655;
  const lng = coords?.lng ?? prev?.lng ?? catalog?.lng ?? -40.488;

  const presence: AmbulantePresence = {
    id: account.catalogId,
    catalogId: account.catalogId,
    name: account.name,
    tag: account.tag,
    online,
    walks: account.walks,
    lat,
    lng,
    whatsapp: account.whatsapp,
    updatedAt: Date.now(),
  };

  if (online) {
    map[account.catalogId] = presence;
  } else {
    map[account.catalogId] = { ...presence, online: false };
  }
  await writePresenceMap(map);
  return presence;
}

export async function heartbeatAmbulante(coords: { lat: number; lng: number }) {
  const account = await getLoggedAccount();
  if (!account) return;
  const map = await readPresenceMap();
  const cur = map[account.catalogId];
  if (!cur?.online) return;
  map[account.catalogId] = {
    ...cur,
    lat: coords.lat,
    lng: coords.lng,
    updatedAt: Date.now(),
  };
  await writePresenceMap(map);
}

export function catalogChoices() {
  return AMBULANTES.filter((v) => v.isSponsor).map((v) => ({
    id: v.id,
    label: `${v.name} · ${v.tag}`,
    online: v.isOnline,
  }));
}
