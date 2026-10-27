import { metersBetween } from "./walk-route";

const METERS_LAT = 1 / 111_320;

export const RAMPA_PRINCIPAL = {
  id: "rampa-principal",
  name: "Rampa principal",
  detail: "Perto do Marlin Azul",
  lat: -20.652309,
  lng: -40.478881,
};

function metersLng(lat: number) {
  return 1 / (111_320 * Math.cos((lat * Math.PI) / 180));
}

function shift(lat: number, lng: number, north: number, east: number): [number, number] {
  return [lat + north * METERS_LAT, lng + east * metersLng(lat)];
}

const HALF_M = 7;
const NORTH_M = 4;
const SOUTH_M = 44;

export const RAMPA_CORRIDOR: [number, number][] = [
  shift(RAMPA_PRINCIPAL.lat, RAMPA_PRINCIPAL.lng, NORTH_M, -HALF_M),
  shift(RAMPA_PRINCIPAL.lat, RAMPA_PRINCIPAL.lng, NORTH_M, HALF_M),
  shift(RAMPA_PRINCIPAL.lat, RAMPA_PRINCIPAL.lng, -SOUTH_M, HALF_M),
  shift(RAMPA_PRINCIPAL.lat, RAMPA_PRINCIPAL.lng, -SOUTH_M, -HALF_M),
];

const MARK_NORTH = -12;
const MARK_SOUTH = -(SOUTH_M - 2);
const MARK_HALF = HALF_M - 0.4;

export const RAMPA_EDGE_LEFT: [number, number][] = [
  shift(RAMPA_PRINCIPAL.lat, RAMPA_PRINCIPAL.lng, MARK_NORTH, -MARK_HALF),
  shift(RAMPA_PRINCIPAL.lat, RAMPA_PRINCIPAL.lng, MARK_SOUTH, -MARK_HALF),
];

export const RAMPA_EDGE_RIGHT: [number, number][] = [
  shift(RAMPA_PRINCIPAL.lat, RAMPA_PRINCIPAL.lng, MARK_NORTH, MARK_HALF),
  shift(RAMPA_PRINCIPAL.lat, RAMPA_PRINCIPAL.lng, MARK_SOUTH, MARK_HALF),
];

export const RAMPA_WARN =
  "Você está na passagem da rampa. Este caminho fica livre para os ambulantes entrarem e saírem, e para os banhistas passarem. Segue ou sai um pouco para a areia.";

export const RAMPA_RULE =
  "Neste corredor não pode guarda-sol, cadeira nem barraca. A passagem fica livre para os ambulantes entrarem e saírem, e para os banhistas irem até a água.";

export const RAMPA_NOTE = "A passagem liga o calçadão à areia. Sem guarda-sol em cima dela.";

export function insideRampCorridor(point: { lat: number; lng: number }) {
  const ring = RAMPA_CORRIDOR;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [latI, lngI] = ring[i];
    const [latJ, lngJ] = ring[j];
    if (latI === latJ) continue;
    const crosses = latI > point.lat !== latJ > point.lat;
    if (!crosses) continue;
    const atLng = ((lngJ - lngI) * (point.lat - latI)) / (latJ - latI) + lngI;
    if (point.lng < atLng) inside = !inside;
  }
  if (inside) return true;
  return metersBetween(point, RAMPA_PRINCIPAL) < 8;
}
