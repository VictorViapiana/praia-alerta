/** Camadas visuais do dia no mapa — Sol e Maré (sem vento). */

export type DayLayer = "off" | "sol" | "mare";

export const DAY_LAYER_CHIPS: { id: DayLayer; label: string; emoji: string }[] = [
  { id: "off", label: "Limpo", emoji: "🗺️" },
  { id: "sol", label: "Sol", emoji: "☀️" },
  { id: "mare", label: "Maré", emoji: "🌊" },
];

/**
 * Travas geográficas da baía da Praia do Morro.
 * Oeste = canal/cidade · Leste = Morro da Pescaria (verde).
 */
export const BAY_LNG_WEST = -40.4969;
export const BAY_LNG_EAST = -40.4750;
/** Fundo do oceano (sul) — fora da tela em zoom de orla. */
const OCEAN_SOUTH = -20.672;

/**
 * Parede seca (junto aos quiosques / calçadão) — a maré NUNCA passa disso
 * em direção à Avenida Beira Mar. Sul → crescente leste.
 */
const DRY_WALL: Array<[number, number]> = [
  [-20.6608, -40.4963],
  [-20.6600, -40.4953],
  [-20.6593, -40.4944],
  [-20.6585, -40.4933],
  [-20.6575, -40.4920],
  [-20.6568, -40.4911],
  [-20.6562, -40.4901],
  [-20.6553, -40.4890],
  [-20.6548, -40.4880],
  [-20.6544, -40.4871],
  [-20.6539, -40.4861],
  [-20.6535, -40.4851],
  [-20.6531, -40.4841],
  [-20.6527, -40.4830],
  [-20.6524, -40.4818],
  [-20.65235, -40.4805],
  [-20.6524, -40.4791],
  [-20.65255, -40.4777],
  [-20.65285, -40.4765],
  [-20.6532, -40.4757],
  [-20.6536, -40.4752],
];

/** Metros seaward da parede seca: vazante (base) → preamar (máx ainda na areia). */
const LOW_TIDE_M = 52;
const HIGH_TIDE_M = 18;
const FEATHER_M = 18;

const METERS_LAT = 1 / 111_320;

function metersLng(lat: number) {
  return 1 / (111_320 * Math.cos((lat * Math.PI) / 180));
}

function densify(anchors: Array<[number, number]>, perSeg = 5): Array<[number, number]> {
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

/** Normal seaward (mar à direita ao andar sul→norte / oeste→leste). */
function seawardNE(prev: [number, number], next: [number, number], lat: number): [number, number] {
  const tN = (next[0] - prev[0]) / METERS_LAT;
  const tE = (next[1] - prev[1]) / metersLng(lat);
  let nE = tN;
  let nN = -tE;
  const len = Math.hypot(nN, nE);
  if (len < 1e-6) return [-0.55, 0.84];
  return [nN / len, nE / len];
}

function clampBay(lat: number, lng: number): [number, number] {
  return [lat, Math.min(BAY_LNG_EAST, Math.max(BAY_LNG_WEST, lng))];
}

/**
 * Empurra a parede seca para o mar (areia/água).
 * Travas: nunca inland da DRY_WALL; laterais dentro da baía.
 */
function projectFromDry(dry: Array<[number, number]>, meters: number): Array<[number, number]> {
  return dry.map((p, i) => {
    const prev = dry[Math.max(0, i - 1)];
    const next = dry[Math.min(dry.length - 1, i + 1)];
    let [nN, nE] = seawardNE(prev, next, p[0]);
    if (nE < 0.2) {
      nE = 0.35;
      nN = Math.min(nN, -0.75);
      const len = Math.hypot(nN, nE);
      nN /= len;
      nE /= len;
    }
    let lat = p[0] + nN * meters * METERS_LAT;
    let lng = p[1] + nE * meters * metersLng(p[0]);
    // Jamais inland (avenida): fica seaward da âncora seca
    lng = Math.max(lng, p[1] + 8 * metersLng(p[0]));
    if (p[1] > -40.4825) {
      lat = Math.min(lat, p[0] - 8 * METERS_LAT);
    }
    return clampBay(lat, lng);
  });
}

function lerpShore(low: Array<[number, number]>, high: Array<[number, number]>, ratio: number) {
  const t = Math.min(1, Math.max(0, ratio));
  return low.map((p, i) => {
    const h = high[i] ?? p;
    return clampBay(p[0] + (h[0] - p[0]) * t, p[1] + (h[1] - p[1]) * t) as [number, number];
  });
}

const DRY_DENSE = densify(DRY_WALL, 5);

/** Base = maré baixa (vazante). High = preamar máximo ainda na areia. */
const SHORE_LOW = projectFromDry(DRY_DENSE, LOW_TIDE_M);
const SHORE_HIGH = projectFromDry(DRY_DENSE, HIGH_TIDE_M);

/**
 * Fundo fixo do oceano (não se move com a API).
 * Oeste → leste no sul, depois sobe nas laterais até a ponta da areia.
 * Assim não há “tampa” reta cortando a água no meio da baía.
 */
function oceanFloor(shoreWest: [number, number], shoreEast: [number, number]): Array<[number, number]> {
  const west = BAY_LNG_WEST;
  const east = BAY_LNG_EAST;
  const mid = (west + east) / 2;
  return [
    // desce da ponta leste (Pescaria) para o oceano — sem entrar no morro
    [shoreEast[0] - 0.0015, east],
    [shoreEast[0] - 0.004, east],
    [OCEAN_SOUTH + 0.004, east],
    [OCEAN_SOUTH, east - 0.001],
    [OCEAN_SOUTH - 0.001, mid],
    [OCEAN_SOUTH, west + 0.001],
    [OCEAN_SOUTH + 0.004, west],
    [shoreWest[0] - 0.004, west],
    [shoreWest[0] - 0.0015, west],
  ];
}

/** Fecha baía: borda norte (areia, dinâmica) + fundo oceano (fixo). */
function bayPolygon(shore: Array<[number, number]>): Array<[number, number]> {
  const west = shore[0];
  const east = shore[shore.length - 1];
  return [...shore, ...oceanFloor(west, east)];
}

export function sunBand(): Array<[number, number]> {
  const warm = projectFromDry(DRY_DENSE, 40);
  const cool = projectFromDry(DRY_DENSE, 6);
  return bayPolygon(lerpShore(warm, cool, 0.5));
}

/**
 * Maré dinâmica via ratio da API (0 = vazante, 1 = preamar).
 * Só a borda da areia (norte) se move entre SHORE_LOW e SHORE_HIGH.
 * Fundo oceano e laterais (canal / Pescaria) são fixos.
 */
export function tideLayers(ratio: number) {
  const t = Math.min(1, Math.max(0, ratio));
  const shore = lerpShore(SHORE_LOW, SHORE_HIGH, t);
  // Feather: linha um pouco mais seaward que a areia (para blur na praia)
  const feather = lerpShore(
    projectFromDry(DRY_DENSE, LOW_TIDE_M + FEATHER_M),
    projectFromDry(DRY_DENSE, HIGH_TIDE_M + FEATHER_M),
    t,
  );
  return {
    body: bayPolygon(shore),
    soft: [...shore, ...[...feather].reverse()],
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
  const t = Math.min(1, Math.max(0, ratio));
  return lerpShore(SHORE_LOW, SHORE_HIGH, t);
}
export function tideSurfLine(ratio: number = 0.45) {
  return tideEdgeLine(ratio);
}

export function tideRatio(level: number, rangeMin: number, rangeMax: number) {
  if (!Number.isFinite(level) || !Number.isFinite(rangeMin) || !Number.isFinite(rangeMax)) return 0.45;
  const span = rangeMax - rangeMin;
  if (span < 0.05) return 0.45;
  return Math.min(1, Math.max(0, (level - rangeMin) / span));
}

export function tideReachLabel(ratio: number) {
  if (ratio < 0.28) return "vazante · água na beira";
  if (ratio < 0.55) return "maré média · molhando a areia";
  if (ratio < 0.78) return "enchente · subindo na areia";
  return "preamar · água na areia alta";
}
