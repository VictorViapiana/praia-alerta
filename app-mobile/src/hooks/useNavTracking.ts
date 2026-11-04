import { useEffect, useMemo, useState } from "react";
import * as Location from "expo-location";
import {
  arrivalLabel,
  followRoute,
  nextManeuver,
  type WalkRoute,
} from "../data/walk-route";

export type NavFix = {
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  moving: boolean;
};

/**
 * GPS em tempo real para navegação (precisão alta + heading).
 * Calcula progresso na polyline via `followRoute`.
 */
export function useNavTracking(enabled: boolean, route: WalkRoute | null) {
  const [fix, setFix] = useState<NavFix | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let posSub: Location.LocationSubscription | null = null;
    let headSub: Location.LocationSubscription | null = null;
    let alive = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!alive || status !== "granted") return;

      posSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 800,
          distanceInterval: 3,
        },
        (pos) => {
          const speed = pos.coords.speed ?? 0;
          const course = pos.coords.heading;
          setFix((prev) => ({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed,
            heading:
              course != null && course >= 0
                ? course
                : prev?.heading ?? null,
            moving: speed > 0.6,
          }));
        },
      );

      try {
        headSub = await Location.watchHeadingAsync((h) => {
          const deg = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          setFix((prev) =>
            prev
              ? { ...prev, heading: deg }
              : {
                  lat: 0,
                  lng: 0,
                  accuracy: null,
                  speed: null,
                  heading: deg,
                  moving: false,
                },
          );
        });
      } catch {
        /* heading indisponível no emulador */
      }
    })().catch(() => undefined);

    return () => {
      alive = false;
      posSub?.remove();
      headSub?.remove();
    };
  }, [enabled]);

  const progress = useMemo(() => {
    if (!route || !fix || (fix.lat === 0 && fix.lng === 0)) return null;
    return followRoute({ lat: fix.lat, lng: fix.lng }, route.line);
  }, [route, fix]);

  const maneuver = useMemo(() => {
    if (!route || !progress) return null;
    const next = nextManeuver(route, progress.traveledMeters);
    if (!next) return null;
    const step = route.steps.find(
      (s) => s.instruction === next.instruction && s.street === next.street,
    );
    return { ...next, speech: step?.speech };
  }, [route, progress]);

  const remainingSeconds = useMemo(() => {
    if (!route || !progress) return route?.seconds ?? 0;
    const ratio = route.meters > 0 ? progress.remainingMeters / route.meters : 1;
    return Math.max(30, Math.round(route.seconds * ratio));
  }, [route, progress]);

  return {
    fix,
    progress,
    maneuver,
    remainingMeters: progress?.remainingMeters ?? route?.meters ?? 0,
    remainingSeconds,
    etaLabel: arrivalLabel(remainingSeconds),
    traveledLine: progress?.traveledLine ?? [],
    remainingLine: progress?.remainingLine ?? route?.line ?? [],
  };
}
