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

/** Proximidade → notificação local (paridade com orla-sentinel web). */
export function useOrlaSentinel({ enabled, fix, onSpot }: Opts) {
  const fired = useRef(new Set<string>());
  const rampEnter = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !fix) return;

    const check = (
      id: string,
      kind: OrlaSpotKind,
      lat: number,
      lng: number,
      radius: number,
      title: string,
      body: string,
    ) => {
      const d = metersBetween(fix, { lat, lng });
      if (d > radius) return;
      if (fired.current.has(id)) return;
      fired.current.add(id);
      onSpot?.(id, kind);
      void pushOrlaNotice({ title, body, tag: id, spot: id, kind });
    };

    check(
      "marlin",
      "marlin",
      MARLIN.lat,
      MARLIN.lng,
      ORLA_RADII.marlin,
      "Marlin Azul",
      "Você está perto do símbolo da orla. Toque para ouvir o Guará.",
    );
    check(
      GOLFINHO.id,
      "golfinho",
      GOLFINHO.lat,
      GOLFINHO.lng,
      ORLA_RADII.golfinho,
      GOLFINHO.name,
      "O Golfinho está logo ali. Quer as dicas do Guará?",
    );

    for (const shower of SHOWERS) {
      check(
        shower.id,
        "ducha",
        shower.lat,
        shower.lng,
        ORLA_RADII.ducha,
        "Ducha na orla",
        "Lembre: moeda de R$ 1. O Guará explica o ritual.",
      );
    }

    for (const place of PLACES.filter((p) => p.mapKind === "quiosques" && p.isSponsor)) {
      check(
        place.id,
        "quiosque",
        place.lat,
        place.lng,
        ORLA_RADII.quiosque,
        place.name,
        place.guaraTip || "Quiosque patrocinador por perto.",
      );
    }

    for (const ramp of RAMPS) {
      const d = metersBetween(fix, { lat: ramp.lat, lng: ramp.lng });
      if (d <= 35) {
        if (!rampEnter.current) rampEnter.current = Date.now();
        else if (Date.now() - rampEnter.current >= ORLA_RADII.rampaDwellMs) {
          const id = `ramp-${ramp.id}`;
          if (!fired.current.has(id)) {
            fired.current.add(id);
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
      } else {
        rampEnter.current = null;
      }
    }
  }, [enabled, fix, onSpot]);
}
