import { metersBetween } from "./walk-route";

const METERS_LAT = 1 / 111_320;

function metersLng(lat: number) {
  return 1 / (111_320 * Math.cos((lat * Math.PI) / 180));
}

function shift(lat: number, lng: number, north: number, east: number): [number, number] {
  return [lat + north * METERS_LAT, lng + east * metersLng(lat)];
}

export type RampAccess = {
  id: string;
  name: string;
  detail: string;
  lat: number;
  lng: number;
  /** Polígono do corredor (lat,lng). */
  corridor: [number, number][];
  edgeLeft: [number, number][];
  edgeRight: [number, number][];
};

/** Corredor N→S: pin no calçadão, faixa para a areia ao sul (rampa do Marlin). */
function corridorNorthSouth(
  lat: number,
  lng: number,
  halfM: number,
  northM: number,
  southM: number,
): Pick<RampAccess, "corridor" | "edgeLeft" | "edgeRight"> {
  const corridor: [number, number][] = [
    shift(lat, lng, northM, -halfM),
    shift(lat, lng, northM, halfM),
    shift(lat, lng, -southM, halfM),
    shift(lat, lng, -southM, -halfM),
  ];
  const markNorth = -Math.min(12, southM * 0.25);
  const markSouth = -(southM - 2);
  const markHalf = halfM - 0.4;
  return {
    corridor,
    edgeLeft: [shift(lat, lng, markNorth, -markHalf), shift(lat, lng, markSouth, -markHalf)],
    edgeRight: [shift(lat, lng, markNorth, markHalf), shift(lat, lng, markSouth, markHalf)],
  };
}

/**
 * Corredor E→O: pin no calçadão, faixa para a areia a oeste
 * (rampa norte / costão, Av. Beira Mar → areia).
 */
function corridorEastWest(
  lat: number,
  lng: number,
  halfM: number,
  eastM: number,
  westM: number,
): Pick<RampAccess, "corridor" | "edgeLeft" | "edgeRight"> {
  const corridor: [number, number][] = [
    shift(lat, lng, halfM, eastM),
    shift(lat, lng, -halfM, eastM),
    shift(lat, lng, -halfM, -westM),
    shift(lat, lng, halfM, -westM),
  ];
  const markEast = Math.min(4, eastM);
  const markWest = -(westM - 2);
  const markHalf = halfM - 0.4;
  return {
    corridor,
    edgeLeft: [shift(lat, lng, markHalf, markEast), shift(lat, lng, markHalf, markWest)],
    edgeRight: [shift(lat, lng, -markHalf, markEast), shift(lat, lng, -markHalf, markWest)],
  };
}

function pointInRing(point: { lat: number; lng: number }, ring: [number, number][]) {
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
  return inside;
}

const principalGeom = corridorNorthSouth(-20.652309, -40.478881, 7, 4, 44);
/** Rampa de acesso norte (−20.653700, −40.474761) — calçadão → areia. */
const norteGeom = corridorEastWest(-20.6537, -40.474761, 6, 5, 38);

export const RAMPA_PRINCIPAL: RampAccess = {
  id: "rampa-principal",
  name: "Rampa principal",
  detail: "Perto do Marlin Azul",
  lat: -20.652309,
  lng: -40.478881,
  ...principalGeom,
};

export const RAMPA_NORTE: RampAccess = {
  id: "rampa-norte",
  name: "Rampa norte",
  detail: "Acesso perto do costão",
  lat: -20.6537,
  lng: -40.474761,
  ...norteGeom,
};

export const RAMPS: RampAccess[] = [RAMPA_PRINCIPAL, RAMPA_NORTE];

/** @deprecated use RAMPA_PRINCIPAL.corridor */
export const RAMPA_CORRIDOR = RAMPA_PRINCIPAL.corridor;
/** @deprecated use RAMPA_PRINCIPAL.edgeLeft */
export const RAMPA_EDGE_LEFT = RAMPA_PRINCIPAL.edgeLeft;
/** @deprecated use RAMPA_PRINCIPAL.edgeRight */
export const RAMPA_EDGE_RIGHT = RAMPA_PRINCIPAL.edgeRight;

export const RAMPA_WARN =
  "Você está na passagem da rampa. Este caminho fica livre para os ambulantes entrarem e saírem, e para os banhistas passarem. Segue ou sai um pouco para a areia.";

export const RAMPA_RULE =
  "Neste corredor não pode guarda-sol, cadeira nem barraca. A passagem fica livre para os ambulantes entrarem e saírem, e para os banhistas irem até a água.";

export const RAMPA_NOTE = "A passagem liga o calçadão à areia. Sem guarda-sol em cima dela.";

export function findRamp(id: string | null | undefined) {
  if (!id) return null;
  return RAMPS.find((ramp) => ramp.id === id) ?? null;
}

export function isRampId(id: string | null | undefined) {
  return Boolean(findRamp(id)) || id === "rampa";
}

/** Qual rampa contém o ponto (ou null). */
export function rampAt(point: { lat: number; lng: number }): RampAccess | null {
  for (const ramp of RAMPS) {
    if (pointInRing(point, ramp.corridor)) return ramp;
    if (metersBetween(point, ramp) < 8) return ramp;
  }
  return null;
}

export function insideRampCorridor(point: { lat: number; lng: number }) {
  return rampAt(point) != null;
}
