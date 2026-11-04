import type { LatLng } from "react-native-maps";

/** Converte [lat, lng] do web (Leaflet) → LatLng nativo. */
export function toLatLng(point: [number, number]): LatLng {
  return { latitude: point[0], longitude: point[1] };
}

export function toLatLngList(points: Array<[number, number]>): LatLng[] {
  return points.map(toLatLng);
}

export function approxZoomFromDelta(latitudeDelta: number): number {
  // Heurística próxima do Leaflet zoom a partir do span vertical.
  return Math.log2(360 / Math.max(latitudeDelta, 1e-6));
}

/** Distância aproximada em metros (haversine). */
export function metersBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
