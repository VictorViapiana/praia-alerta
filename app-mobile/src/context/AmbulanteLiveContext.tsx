import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as Location from "expo-location";
import type { Ambulante } from "../data/places";
import {
  getLoggedAccount,
  heartbeatAmbulante,
  mergeLiveAmbulantes,
  readPresenceMap,
  setAmbulanteOnline,
  subscribeAmbulanteHub,
  type AmbulanteAccount,
  type AmbulantePresence,
} from "../data/ambulante-hub";

type Ctx = {
  vendors: Ambulante[];
  account: AmbulanteAccount | null;
  presence: AmbulantePresence | null;
  online: boolean;
  refreshing: boolean;
  reload: () => Promise<void>;
  goOnline: () => Promise<void>;
  goOffline: () => Promise<void>;
  refreshAccount: () => Promise<void>;
};

const AmbulanteLiveCtx = createContext<Ctx | null>(null);

export function AmbulanteLiveProvider({ children }: { children: React.ReactNode }) {
  const [vendors, setVendors] = useState<Ambulante[]>([]);
  const [account, setAccount] = useState<AmbulanteAccount | null>(null);
  const [presence, setPresence] = useState<AmbulantePresence | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    setRefreshing(true);
    try {
      const map = await readPresenceMap();
      setVendors(mergeLiveAmbulantes(map));
      const acc = await getLoggedAccount();
      setAccount(acc);
      if (acc) {
        const mine = map[acc.catalogId] ?? null;
        setPresence(mine);
      } else {
        setPresence(null);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  const refreshAccount = useCallback(async () => {
    setAccount(await getLoggedAccount());
    await reload();
  }, [reload]);

  useEffect(() => {
    void reload();
    const unsub = subscribeAmbulanteHub(() => {
      void reload();
    });
    const tick = setInterval(() => {
      void reload();
    }, 2500);
    return () => {
      unsub();
      clearInterval(tick);
    };
  }, [reload]);

  // Heartbeat GPS enquanto online — pin anda na areia em tempo real.
  useEffect(() => {
    if (!account || !presence?.online) return;
    let sub: Location.LocationSubscription | null = null;
    let alive = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!alive || status !== "granted") return;
      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 4000,
          distanceInterval: 6,
        },
        (pos) => {
          void heartbeatAmbulante({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
      );
    })().catch(() => undefined);
    return () => {
      alive = false;
      sub?.remove();
    };
  }, [account, presence?.online]);

  const goOnline = useCallback(async () => {
    let coords: { lat: number; lng: number } | undefined;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }
    } catch {
      /* usa lat/lng do catálogo */
    }
    const next = await setAmbulanteOnline(true, coords);
    setPresence(next);
    await reload();
  }, [reload]);

  const goOffline = useCallback(async () => {
    const next = await setAmbulanteOnline(false);
    setPresence(next);
    await reload();
  }, [reload]);

  const value = useMemo(
    () => ({
      vendors,
      account,
      presence,
      online: Boolean(presence?.online),
      refreshing,
      reload,
      goOnline,
      goOffline,
      refreshAccount,
    }),
    [vendors, account, presence, refreshing, reload, goOnline, goOffline, refreshAccount],
  );

  return <AmbulanteLiveCtx.Provider value={value}>{children}</AmbulanteLiveCtx.Provider>;
}

export function useAmbulanteLive() {
  const ctx = useContext(AmbulanteLiveCtx);
  if (!ctx) throw new Error("useAmbulanteLive outside provider");
  return ctx;
}
