"use client";

import { useEffect, useRef, useState } from "react";
import { GOLFINHO, MARLIN, MARLIN_SPEAK, MARLIN_TIPS, PLACES, SHOWERS, SHOWER_SPEAK } from "./places";
import {
  EXIT_HYSTERESIS_M,
  MONUMENT_RADIUS_M,
  QUIOSQUE_ACCURACY_M,
  QUIOSQUE_EXIT_HYSTERESIS_M,
  QUIOSQUE_RADIUS_M,
  SHOWER_RADIUS_M,
  pushOrlaNotice,
  rampDwellMs,
  stashPendingSpot,
  type OrlaSpotKind,
} from "./orla-notify";
import { RAMPA_RULE, RAMPA_WARN, rampAt } from "./rampas";
import { metersBetween } from "./walk-route";

export type OrlaAlert =
  | { kind: "marlin" }
  | { kind: "golfinho" }
  | { kind: "rampa"; id: string }
  | { kind: "ducha"; id: string }
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

async function notify(kind: OrlaSpotKind, spot: string, title: string, body: string, tagBase: string) {
  // Guarda o deep link antes do banner — se o OS matar a aba, o toque ainda abre o ícone certo.
  stashPendingSpot(spot);
  // Tag única por entrada: iOS/Android não engolem a 2ª chegada com a mesma tag.
  const tag = `${tagBase}-${Date.now()}`;
  await pushOrlaNotice({ kind, spot, title, body, tag, renotify: true });
}

/**
 * Vigia a orla: Marlin/Golfinho (200 m), duchas (moeda), quiosques e rampas (3 min).
 * Quiosques: notifica SEMPRE ao entrar na zona (app aberto ou em segundo plano).
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
  const [rampAlertId, setRampAlertId] = useState<string | null>(null);
  const onAlert = useRef(onForegroundAlert);
  onAlert.current = onForegroundAlert;

  const inside = useRef<Set<ZoneKey>>(new Set());
  const rampActiveId = useRef<string | null>(null);
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

    const resetRamp = () => {
      rampActiveId.current = null;
      rampSince.current = null;
      rampNotified.current = false;
      rampDismissed.current = false;
      clearRampTimer();
      setRampAlertId(null);
      inside.current.delete("rampa");
    };

    const fireRamp = () => {
      const rampId = rampActiveId.current;
      if (!rampId || rampDismissed.current) return;
      if (rampSince.current == null) return;
      if (Date.now() - rampSince.current < rampDwellMs()) return;
      setRampAlertId(rampId);
      if (isAppVisible()) {
        onAlert.current({ kind: "rampa", id: rampId });
        return;
      }
      if (rampNotified.current) return;
      rampNotified.current = true;
      void notify(
        "rampa",
        rampId,
        "Rampa · 3 min no corredor",
        `${RAMPA_WARN}\n\n${RAMPA_RULE}`,
        `orla-${rampId}`,
      );
    };

    const watch = navigator.geolocation.watchPosition(
      (position) => {
        const accuracy = Number(position.coords.accuracy);
        // GPS ruim: NÃO aborta o loop — ainda processa SAÍDAS para rearmar a zona.
        const accuracyOkMonument = !Number.isFinite(accuracy) || accuracy <= 55;
        const accuracyOkQuiosque = !Number.isFinite(accuracy) || accuracy <= QUIOSQUE_ACCURACY_M;
        const here = { lat: position.coords.latitude, lng: position.coords.longitude };
        const visible = isAppVisible();

        const checkZone = (
          key: ZoneKey,
          point: { lat: number; lng: number },
          radius: number,
          enter: () => void,
          opts?: { exitHysteresis?: number; accuracyOk?: boolean },
        ) => {
          const exitExtra = opts?.exitHysteresis ?? EXIT_HYSTERESIS_M;
          const mayEnter = opts?.accuracyOk ?? accuracyOkMonument;
          const dist = metersBetween(here, point);
          const was = inside.current.has(key);
          if (was && dist > radius + exitExtra) {
            // Saiu de verdade → rearma para a próxima passagem
            inside.current.delete(key);
            return;
          }
          if (!was && dist <= radius) {
            if (!mayEnter) return;
            inside.current.add(key);
            enter();
          }
        };

        checkZone("marlin", MARLIN, MONUMENT_RADIUS_M, () => {
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

        checkZone("golfinho", GOLFINHO, MONUMENT_RADIUS_M, () => {
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

        // Duchas públicas: ritual da moeda de R$ 1 + convivência.
        for (const shower of SHOWERS) {
          checkZone(`ducha:${shower.id}`, shower, SHOWER_RADIUS_M, () => {
            if (visible) {
              onAlert.current({ kind: "ducha", id: shower.id });
              return;
            }
            void notify(
              "ducha",
              shower.id,
              `${shower.name} · moeda de R$ 1`,
              `${SHOWER_SPEAK}\n\nAbra o app: o Guará abre o portal da água.`,
              `orla-ducha-${shower.id}`,
            );
          });
        }

        // Passagem pelos quiosques: notifica cada um ao entrar na zona (mesmo com app aberto).
        for (const place of QUIOSQUES) {
          const key = `q:${place.id}`;
          checkZone(
            key,
            place,
            QUIOSQUE_RADIUS_M,
            () => {
              void notify(
                "quiosque",
                place.id,
                `Passando pelo ${place.name}`,
                `Você está perto do ${place.name} na areia. Toque para abrir no mapa.`,
                `orla-${place.id}`,
              );
              if (visible) onAlert.current({ kind: "quiosque", id: place.id, name: place.name });
            },
            { exitHysteresis: QUIOSQUE_EXIT_HYSTERESIS_M, accuracyOk: accuracyOkQuiosque },
          );
        }

        const hit = rampAt(here);
        if (!hit) {
          resetRamp();
          return;
        }

        if (!accuracyOkMonument) return;

        // Trocou de rampa → reinicia a contagem de 3 min.
        if (rampActiveId.current && rampActiveId.current !== hit.id) {
          resetRamp();
        }

        rampActiveId.current = hit.id;
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
      { enableHighAccuracy: true, maximumAge: 1200, timeout: 15000 },
    );

    return () => {
      clearRampTimer();
      navigator.geolocation.clearWatch(watch);
    };
  }, [enabled]);

  return {
    rampAlertId,
    /** Compat: true se qualquer rampa estiver em alerta. */
    rampAlert: rampAlertId != null,
    dismissRamp() {
      rampDismissed.current = true;
      setRampAlertId(null);
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
    alertId: ramp.rampAlertId,
    dismiss: ramp.dismissRamp,
  };
}

export const MARLIN_TOUR_STEPS = MARLIN_TIPS.map((tip) => ({
  title: tip.title,
  text: tip.text,
  kind: tip.title.includes("lixo") || tip.title.includes("risque") ? ("convivencia" as const) : ("alerta" as const),
}));

export const MARLIN_TOUR_SPEAK = MARLIN_SPEAK;
