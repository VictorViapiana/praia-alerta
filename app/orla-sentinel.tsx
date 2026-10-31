"use client";

import { useEffect, useRef, useState } from "react";
import { GOLFINHO, MARLIN, MARLIN_SPEAK, MARLIN_TIPS, PLACES } from "./places";
import {
  EXIT_HYSTERESIS_M,
  MONUMENT_RADIUS_M,
  QUIOSQUE_RADIUS_M,
  pushOrlaNotice,
  rampDwellMs,
  stashPendingSpot,
  type OrlaSpotKind,
} from "./orla-notify";
import { RAMPA_PRINCIPAL, RAMPA_RULE, RAMPA_WARN, insideRampCorridor } from "./rampas";
import { metersBetween } from "./walk-route";

export type OrlaAlert =
  | { kind: "marlin" }
  | { kind: "golfinho" }
  | { kind: "rampa" }
  | { kind: "quiosque"; id: string; name: string };

type ZoneKey = string;

const QUIOSQUES = PLACES.filter((place) => place.mapKind === "quiosques");

function isAppVisible() {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible";
}

function marlinBodies() {
  return MARLIN_TIPS.map((tip) => `• ${tip.title}: ${tip.text}`).join("\n");
}

function golfinhoBodies() {
  return GOLFINHO.tips.map((tip) => `• ${tip.title}: ${tip.text}`).join("\n");
}

async function notify(kind: OrlaSpotKind, spot: string, title: string, body: string, tag: string) {
  // Guarda o deep link antes do banner — se o OS matar a aba, o toque ainda abre o ícone certo.
  stashPendingSpot(spot);
  await pushOrlaNotice({ kind, spot, title, body, tag, renotify: true });
}

/**
 * Vigia a orla: Marlin/Golfinho (200 m), quiosques (chegada) e rampa (3 min).
 * App em evidência → callback para o Guará. App fechado/segundo plano → notificação.
 */
export function useOrlaSentinel({
  enabled,
  mapOpen,
  onForegroundAlert,
}: {
  enabled: boolean;
  mapOpen: boolean;
  onForegroundAlert: (alert: OrlaAlert) => void;
}) {
  const [rampAlert, setRampAlert] = useState(false);
  const onAlert = useRef(onForegroundAlert);
  onAlert.current = onForegroundAlert;

  const inside = useRef<Set<ZoneKey>>(new Set());
  const rampSince = useRef<number | null>(null);
  const rampNotified = useRef(false);
  const rampDismissed = useRef(false);
  const rampTimer = useRef<number | null>(null);
  const mapOpenRef = useRef(mapOpen);
  mapOpenRef.current = mapOpen;

  useEffect(() => {
    // Soft prompt: `enabled` só fica true após aceite na LocationSoftPrompt.
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) return;

    const clearRampTimer = () => {
      if (rampTimer.current != null) {
        window.clearTimeout(rampTimer.current);
        rampTimer.current = null;
      }
    };

    const fireRamp = () => {
      if (rampDismissed.current) return;
      if (rampSince.current == null) return;
      if (Date.now() - rampSince.current < rampDwellMs()) return;
      setRampAlert(true);
      if (isAppVisible()) {
        onAlert.current({ kind: "rampa" });
        return;
      }
      if (rampNotified.current) return;
      rampNotified.current = true;
      void notify(
        "rampa",
        RAMPA_PRINCIPAL.id,
        "Rampa · 3 min no corredor",
        `${RAMPA_WARN}\n\n${RAMPA_RULE}`,
        "orla-rampa",
      );
    };

    const watch = navigator.geolocation.watchPosition(
      (position) => {
        // GPS ruim demais gera falso positivo nos quiosques
        const accuracy = Number(position.coords.accuracy);
        if (Number.isFinite(accuracy) && accuracy > 55) return;
        const here = { lat: position.coords.latitude, lng: position.coords.longitude };
        const visible = isAppVisible();

        const checkMonument = (
          key: ZoneKey,
          point: { lat: number; lng: number },
          radius: number,
          enter: () => void,
        ) => {
          const dist = metersBetween(here, point);
          const was = inside.current.has(key);
          if (!was && dist <= radius) {
            inside.current.add(key);
            enter();
          } else if (was && dist > radius + EXIT_HYSTERESIS_M) {
            inside.current.delete(key);
          }
        };

        checkMonument("marlin", MARLIN, MONUMENT_RADIUS_M, () => {
          if (visible) {
            onAlert.current({ kind: "marlin" });
            return;
          }
          void notify(
            "marlin",
            MARLIN.id,
            "Marlin Azul · 200 m",
            `Você chegou perto do símbolo da orla.\n${marlinBodies()}\n\nAbra o app: o Guará te guia com cuidado e boa convivência.`,
            "orla-marlin",
          );
        });

        checkMonument("golfinho", GOLFINHO, MONUMENT_RADIUS_M, () => {
          if (visible) {
            onAlert.current({ kind: "golfinho" });
            return;
          }
          void notify(
            "golfinho",
            GOLFINHO.id,
            "Estátua do Golfinho · 200 m",
            `Você chegou ao monumento no costão.\n${golfinhoBodies()}\n\nAbra o app: o Guará mostra os alertas um a um.`,
            "orla-golfinho",
          );
        });

        for (const place of QUIOSQUES) {
          const key = `q:${place.id}`;
          const dist = metersBetween(here, place);
          const was = inside.current.has(key);
          if (!was && dist <= QUIOSQUE_RADIUS_M) {
            inside.current.add(key);
            void notify(
              "quiosque",
              place.id,
              `Você chegou ao ${place.name}!`,
              `${place.name} está bem aqui na areia. Toque para abrir o mapa com o quiosque selecionado.`,
              `orla-${place.id}`,
            );
            if (visible) onAlert.current({ kind: "quiosque", id: place.id, name: place.name });
          } else if (was && dist > QUIOSQUE_RADIUS_M + EXIT_HYSTERESIS_M) {
            inside.current.delete(key);
          }
        }

        if (!insideRampCorridor(here)) {
          rampSince.current = null;
          rampNotified.current = false;
          rampDismissed.current = false;
          clearRampTimer();
          setRampAlert(false);
          inside.current.delete("rampa");
          return;
        }

        inside.current.add("rampa");
        const now = Date.now();
        if (rampSince.current == null) {
          rampSince.current = now;
          clearRampTimer();
          rampTimer.current = window.setTimeout(fireRamp, rampDwellMs() + 30);
        }
        fireRamp();
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 20000 },
    );

    return () => {
      clearRampTimer();
      navigator.geolocation.clearWatch(watch);
    };
  }, [enabled]);

  return {
    rampAlert,
    dismissRamp() {
      rampDismissed.current = true;
      setRampAlert(false);
    },
  };
}

/** Compat: mesma API antiga usada pela home. */
export function useRampWatch(mapOpen: boolean, enabled = true) {
  const ramp = useOrlaSentinel({
    enabled,
    mapOpen,
    onForegroundAlert: () => {},
  });
  return {
    alert: ramp.rampAlert,
    dismiss: ramp.dismissRamp,
  };
}

export const MARLIN_TOUR_STEPS = MARLIN_TIPS.map((tip) => ({
  title: tip.title,
  text: tip.text,
  kind: tip.title.includes("lixo") || tip.title.includes("risque") ? ("convivencia" as const) : ("alerta" as const),
}));

export const MARLIN_TOUR_SPEAK = MARLIN_SPEAK;
