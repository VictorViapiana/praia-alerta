import { useEffect, useRef } from "react";
import { metersBetween } from "../data/walk-route";
import { GOLFINHO, MARLIN, SHOWERS, PLACES } from "../data/places";
import { RAMPS } from "../data/rampas";
import { ORLA_RADII, pushOrlaNotice, type OrlaSpotKind } from "../data/orla-notify";
import type { UserFix } from "./useUserLocation";

type Opts = {
  enabled: boolean;
  fix: UserFix | null;
  onSpot?: (spot: string, kind: OrlaSpotKind) => void;
};

/**
 * Proximidade com histerese / reentrada (paridade com orla-sentinel web).
 * Sai do raio → desarma; volta → pode disparar de novo.
 */
export function useOrlaSentinel({ enabled, fix, onSpot }: Opts) {
  const inside = useRef(new Set<string>());
  const fired = useRef(new Set<string>());
  const rampEnter = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!enabled || !fix) return;
    if (fix.accuracy != null && fix.accuracy > 80) return;

    const consider = (
      id: string,
      kind: OrlaSpotKind,
      lat: number,
      lng: number,
      radius: number,
      exitPad: number,
      title: string,
      body: string,
    ) => {
      const d = metersBetween(fix, { lat, lng });
      const wasIn = inside.current.has(id);
      if (d <= radius) {
        inside.current.add(id);
        if (!fired.current.has(id)) {
          fired.current.add(id);
          onSpot?.(id, kind);
          void pushOrlaNotice({ title, body, tag: id, spot: id, kind });
        }
      } else if (wasIn && d > radius + exitPad) {
        inside.current.delete(id);
        fired.current.delete(id);
      }
    };

    consider(
      "marlin",
      "marlin",
      MARLIN.lat,
      MARLIN.lng,
      ORLA_RADII.marlin,
      40,
      "Marlin Azul",
      "Você está perto do símbolo da orla. Toque para ouvir o Guará.",
    );
    consider(
      GOLFINHO.id,
      "golfinho",
      GOLFINHO.lat,
      GOLFINHO.lng,
      ORLA_RADII.golfinho,
      40,
      GOLFINHO.name,
      "O Golfinho está logo ali. Quer as dicas do Guará?",
    );

    for (const shower of SHOWERS) {
      consider(
        shower.id,
        "ducha",
        shower.lat,
        shower.lng,
        ORLA_RADII.ducha,
        18,
        "Ducha na orla",
        "Lembre: moeda de R$ 1. O Guará explica o ritual.",
      );
    }

    for (const place of PLACES.filter((p) => p.mapKind === "quiosques" && p.isSponsor)) {
      consider(
        place.id,
        "quiosque",
        place.lat,
        place.lng,
        ORLA_RADII.quiosque,
        22,
        place.name,
        place.guaraTip || "Quiosque patrocinador por perto.",
      );
    }

    for (const ramp of RAMPS) {
      const d = metersBetween(fix, { lat: ramp.lat, lng: ramp.lng });
      const id = `ramp-${ramp.id}`;
      if (d <= 35) {
        if (!rampEnter.current[id]) rampEnter.current[id] = Date.now();
        else if (Date.now() - rampEnter.current[id] >= ORLA_RADII.rampaDwellMs) {
          if (!fired.current.has(id)) {
            fired.current.add(id);
            inside.current.add(id);
            onSpot?.(ramp.id, "rampa");
            void pushOrlaNotice({
              title: ramp.name,
              body: "Rampa de acesso — deixe o corredor livre.",
              tag: id,
              spot: ramp.id,
              kind: "rampa",
            });
          }
        }
      } else if (d > 55) {
        delete rampEnter.current[id];
        inside.current.delete(id);
        fired.current.delete(id);
      }
    }
  }, [enabled, fix, onSpot]);
}
