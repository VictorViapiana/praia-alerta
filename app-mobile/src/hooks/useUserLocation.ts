import { useEffect, useState } from "react";
import * as Location from "expo-location";

export type UserFix = {
  lat: number;
  lng: number;
  accuracy: number | null;
};

/** Localização suave — pedida só quando a tela do mapa monta. */
export function useUserLocation(enabled = true) {
  const [fix, setFix] = useState<UserFix | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let sub: Location.LocationSubscription | null = null;
    let alive = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!alive) return;
      if (status !== "granted") {
        setDenied(true);
        return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!alive) return;
      setFix({
        lat: current.coords.latitude,
        lng: current.coords.longitude,
        accuracy: current.coords.accuracy,
      });
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 8 },
        (pos) => {
          setFix({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
      );
    })().catch(() => setDenied(true));

    return () => {
      alive = false;
      sub?.remove();
    };
  }, [enabled]);

  return { fix, denied };
}
