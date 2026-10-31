/** Camadas visuais do dia no mapa — Sol e Maré (sem vento). */

export type DayLayer = "off" | "sol" | "mare";

export const DAY_LAYER_CHIPS: { id: DayLayer; label: string; emoji: string }[] = [
  { id: "off", label: "Limpo", emoji: "🗺️" },
  { id: "sol", label: "Sol", emoji: "☀️" },
  { id: "mare", label: "Maré", emoji: "🌊" },
];

/** Janela do Sol na areia: ativo só entre 05:30 e 17:30 (America/Sao_Paulo). */
export const SUN_ON_HOUR = 5.5;
export const SUN_OFF_HOUR = 17.5;

/**
 * Parede seca (quiosques / calçadão) — limite máximo inland.
 * Maré e Sol nunca passam disso em direção à Avenida Beira Mar.
 *
 * Ponta oeste já a leste da península urbana.
 * Ponta leste já a oeste do Morro da Pescaria (verde).
 */
const DRY_WALL: Array<[number, number]> = [
  [-20.6605, -40.49555],
  [-20.6598, -40.49485],
  [-20.6591, -40.49405],
  [-20.6583, -40.49305],
  [-20.6574, -40.4919],
  [-20.6567, -40.4910],
  [-20.6561, -40.4900],
  [-20.6552, -40.48895],
  [-20.6547, -40.48795],
  [-20.6543, -40.48705],
  [-20.65385, -40.48605],
  [-20.65345, -40.48505],
  [-20.65305, -40.48405],
  [-20.6527, -40.4830],
  [-20.6524, -40.4818],
  [-20.65235, -40.4805],
  [-20.6524, -40.4792],
  [-20.65255, -40.4779],
  [-20.65285, -40.4767],
  [-20.65315, -40.47595],
  [-20.65345, -40.47545],
];

/** Metros seaward: vazante → preamar (ainda na areia). */
const LOW_TIDE_M = 50;
const HIGH_TIDE_M = 16;
const FEATHER_M = 12;

/** Faixa de areia para o Sol. */
const SAND_LAND_M = 3;
const SAND_SEA_M = 36;

/** Limites de água — NUNCA tocar península (oeste) nem morro verde (leste). */
const WATER_LNG_WEST = -40.49535; // a leste da cidade/península
const WATER_LNG_EAST = -40.47515; // a oeste do Morro da Pescaria

const METERS_LAT = 1 / 111_320;

function metersLng(lat: number) {
  return 1 / (111_320 * Math.cos((lat * Math.PI) / 180));
}

/** Hora decimal em America/Sao_Paulo. */
export function localHourSaoPaulo(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 12);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h + m / 60;
}

export function isSunActive(now = new Date()) {
  const h = localHourSaoPaulo(now);
  return h >= SUN_ON_HOUR && h < SUN_OFF_HOUR;
}

function densify(anchors: Array<[number, number]>, perSeg = 6): Array<[number, number]> {
  if (anchors.length < 2) return anchors.slice();
  const out: Array<[number, number]> = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [aLat, aLng] = anchors[i];
    const [bLat, bLng] = anchors[i + 1];
    for (let s = 0; s < perSeg; s++) {
      const t = s / perSeg;
      out.push([aLat + (bLat - aLat) * t, aLng + (bLng - aLng) * t]);
    }
  }
  out.push(anchors[anchors.length - 1]);
  return out;
}

function seawardNE(prev: [number, number], next: [number, number], lat: number): [number, number] {
  const tN = (next[0] - prev[0]) / METERS_LAT;
  const tE = (next[1] - prev[1]) / metersLng(lat);
  let nE = tN;
  let nN = -tE;
  const len = Math.hypot(nN, nE);
  if (len < 1e-6) return [-0.55, 0.84];
  return [nN / len, nE / len];
}

/** Mantém ponto estritamente dentro da água da baía. */
function clampWater(lat: number, lng: number): [number, number] {
  return [lat, Math.min(WATER_LNG_EAST, Math.max(WATER_LNG_WEST, lng))];
}

function projectFromDry(dry: Array<[number, number]>, meters: number): Array<[number, number]> {
  return dry.map((p, i) => {
    const prev = dry[Math.max(0, i - 1)];
    const next = dry[Math.min(dry.length - 1, i + 1)];
    let [nN, nE] = seawardNE(prev, next, p[0]);
    if (nE < 0.2) {
      nE = 0.42;
      nN = Math.min(nN, -0.8);
      const len = Math.hypot(nN, nE);
      nN /= len;
      nE /= len;
    }
    let lat = p[0] + nN * meters * METERS_LAT;
    let lng = p[1] + nE * meters * metersLng(p[0]);
    lng = Math.max(lng, p[1] + 6 * metersLng(p[0]));
    if (p[1] > -40.482) {
      lat = Math.min(lat, p[0] - 6 * METERS_LAT);
    }
    return clampWater(lat, lng);
  });
}

function lerpShore(low: Array<[number, number]>, high: Array<[number, number]>, ratio: number) {
  const t = Math.min(1, Math.max(0, ratio));
  return low.map((p, i) => {
    const h = high[i] ?? p;
    return clampWater(p[0] + (h[0] - p[0]) * t, p[1] + (h[1] - p[1]) * t);
  });
}

function closedBand(seaSide: Array<[number, number]>, landSide: Array<[number, number]>) {
  return [...seaSide, ...[...landSide].reverse()];
}

const DRY_DENSE = densify(DRY_WALL, 6);
const SHORE_LOW = projectFromDry(DRY_DENSE, LOW_TIDE_M);
const SHORE_HIGH = projectFromDry(DRY_DENSE, HIGH_TIDE_M);

/**
 * Meia-lua da baía — SÓ água.
 * Norte = borda da areia (API).
 * Leste/oeste = arcos côncavos que desviam do morro verde e da península,
 * sem paredes retas / bbox / losango.
 */
function crescentBasin(shore: Array<[number, number]>): Array<[number, number]> {
  const westTip = clampWater(shore[0][0], shore[0][1]);
  const eastTip = clampWater(shore[shore.length - 1][0], shore[shore.length - 1][1]);

  // Leste: da ponta da areia DESCE no mar (sul), curvando para DENTRO da baía —
  // nunca para o leste do Morro da Pescaria (WATER_LNG_EAST).
  const eastArc: Array<[number, number]> = [
    [eastTip[0] - 0.00035, Math.min(eastTip[1], WATER_LNG_EAST)],
    [eastTip[0] - 0.0009, WATER_LNG_EAST - 0.00005],
    [-20.6548, -40.47535],
    [-20.6556, -40.47545],
    [-20.6565, -40.47555], // água ao sul do costão, antes do verde
    [-20.6575, -40.47575],
    [-20.6586, -40.47615],
    [-20.6598, -40.47675],
    [-20.6610, -40.47755],
    [-20.6623, -40.47855],
    [-20.6636, -40.47975],
    [-20.6649, -40.48115],
    [-20.6661, -40.48275],
    [-20.6672, -40.48455],
    [-20.6681, -40.48655],
    [-20.6688, -40.48865],
    [-20.6692, -40.49065],
  ];

  // Oeste: do oceano SOBE contornando a península pelo mar —
  // sempre a leste de WATER_LNG_WEST (nunca cobre a cidade).
  const westArc: Array<[number, number]> = [
    [-20.6692, -40.49215],
    [-20.6688, -40.49335],
    [-20.6681, -40.49415],
    [-20.6670, -40.49465],
    [-20.6656, -40.49495],
    [-20.6642, -40.4951],
    [-20.6628, -40.4952],
    [-20.6615, -40.49525],
    [-20.6604, WATER_LNG_WEST],
    [westTip[0] - 0.0004, Math.max(westTip[1], WATER_LNG_WEST)],
  ];

  // Densifica só os arcos laterais (costa curva); shore já é denso
  const east = densify(eastArc, 3);
  const west = densify(westArc, 3);
  return [...shore.map(([lat, lng]) => clampWater(lat, lng)), ...east, ...west];
}

export function sunHeatFactor(now = new Date()) {
  if (!isSunActive(now)) return 0;
  const hour = localHourSaoPaulo(now);
  const peak = 13;
  return Math.max(0.25, Math.min(1, 1 - Math.abs(hour - peak) / 7));
}

export function sunAzimuthDeg(now = new Date()) {
  const hour = localHourSaoPaulo(now);
  return (
    80 +
    ((Math.min(SUN_OFF_HOUR, Math.max(SUN_ON_HOUR, hour)) - SUN_ON_HOUR) / (SUN_OFF_HOUR - SUN_ON_HOUR)) * 200
  );
}

export function sunSandRings(): {
  wash: Array<[number, number]>;
  mid: Array<[number, number]>;
  core: Array<[number, number]>;
} {
  const land0 = projectFromDry(DRY_DENSE, SAND_LAND_M);
  const land1 = projectFromDry(DRY_DENSE, SAND_LAND_M + 5);
  const land2 = projectFromDry(DRY_DENSE, SAND_LAND_M + 10);
  const sea0 = projectFromDry(DRY_DENSE, SAND_SEA_M);
  const sea1 = projectFromDry(DRY_DENSE, SAND_SEA_M - 8);
  const sea2 = projectFromDry(DRY_DENSE, SAND_SEA_M - 16);
  return {
    wash: closedBand(sea0, land0),
    mid: closedBand(sea1, land1),
    core: closedBand(sea2, land2),
  };
}

export function sunSandBand(): Array<[number, number]> {
  return sunSandRings().wash;
}

/** @deprecated */
export function sunSandCore(): Array<[number, number]> {
  return sunSandRings().core;
}
export function sunBand() {
  return sunSandBand();
}

/**
 * Maré: borda da areia = lerp pela ratio da API ao vivo;
 * corpo = meia-lua só na água.
 */
export function tideLayers(ratio: number) {
  const t = Math.min(1, Math.max(0, ratio));
  const shore = lerpShore(SHORE_LOW, SHORE_HIGH, t);
  const softNear = lerpShore(
    projectFromDry(DRY_DENSE, LOW_TIDE_M + FEATHER_M * 0.45),
    projectFromDry(DRY_DENSE, HIGH_TIDE_M + FEATHER_M * 0.45),
    t,
  );
  const softFar = lerpShore(
    projectFromDry(DRY_DENSE, LOW_TIDE_M + FEATHER_M),
    projectFromDry(DRY_DENSE, HIGH_TIDE_M + FEATHER_M),
    t,
  );
  return {
    body: crescentBasin(shore),
    soft: closedBand(softFar, shore),
    softInner: closedBand(softNear, shore),
  };
}

/** @deprecated */
export function tideOceanBand(ratio: number) {
  return tideLayers(ratio).body;
}
export function tideWaterBand(ratio: number) {
  return tideLayers(ratio).body;
}
export function tideWetSandBand(ratio: number) {
  return tideLayers(ratio).soft;
}
export function tideEdgeLine(ratio: number) {
  return lerpShore(SHORE_LOW, SHORE_HIGH, Math.min(1, Math.max(0, ratio)));
}
export function tideSurfLine(ratio: number = 0.45) {
  return tideEdgeLine(ratio);
}

/**
 * Ratio 0–1 a partir do nível AO VIVO da API (sea_level_height_msl).
 * Sem dado finito → null (nunca inventa 0.45 mockado na camada).
 */
export function tideRatio(level: number, rangeMin: number, rangeMax: number): number | null {
  if (!Number.isFinite(level) || !Number.isFinite(rangeMin) || !Number.isFinite(rangeMax)) return null;
  const span = rangeMax - rangeMin;
  if (span < 0.05) return null;
  return Math.min(1, Math.max(0, (level - rangeMin) / span));
}

export function tideReachLabel(ratio: number) {
  if (ratio < 0.28) return "vazante · água na beira";
  if (ratio < 0.55) return "maré média · molhando a areia";
  if (ratio < 0.78) return "enchente · subindo na areia";
  return "preamar · água na areia alta";
}
