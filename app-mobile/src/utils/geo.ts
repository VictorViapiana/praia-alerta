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
