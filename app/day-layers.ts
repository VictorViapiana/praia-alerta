/** Camadas visuais do dia no mapa — Sol e Maré (sem vento). */

export type DayLayer = "off" | "sol" | "mare";

export const DAY_LAYER_CHIPS: { id: DayLayer; label: string; emoji: string }[] = [
  { id: "off", label: "Limpo", emoji: "🗺️" },
  { id: "sol", label: "Sol", emoji: "☀️" },
  { id: "mare", label: "Maré", emoji: "🌊" },
];

/**
 * Travas da baía — água só.
 * Oeste: canal/cidade (nunca inland). Leste: base do Morro da Pescaria na água.
 */
export const BAY_LNG_WEST = -40.49585;
export const BAY_LNG_EAST = -40.47385;
/** Fundo do oceano (sul) — fora da tela em zoom de orla. */
const OCEAN_SOUTH = -20.672;

/**
 * Parede seca (quiosques / calçadão) — limite máximo inland.
 * Maré e Sol nunca passam disso em direção à Avenida Beira Mar.
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

/** Metros seaward: vazante → preamar (ainda na areia). */
const LOW_TIDE_M = 55;
const HIGH_TIDE_M = 20;
const FEATHER_M = 16;

/** Faixa de areia para o Sol (não oceano, não avenida). */
const SAND_LAND_M = 3;
const SAND_SEA_M = 38;

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
 * Empurra a parede seca para o mar.
 * Nunca inland; no crescente força sul; laterais sem canal/Pescaria inland.
 */
function projectFromDry(dry: Array<[number, number]>, meters: number): Array<[number, number]> {
  return dry.map((p, i) => {
    const prev = dry[Math.max(0, i - 1)];
    const next = dry[Math.min(dry.length - 1, i + 1)];
    let [nN, nE] = seawardNE(prev, next, p[0]);
    if (nE < 0.22) {
      nE = 0.38;
      nN = Math.min(nN, -0.78);
      const len = Math.hypot(nN, nE);
      nN /= len;
      nE /= len;
    }
    let lat = p[0] + nN * meters * METERS_LAT;
    let lng = p[1] + nE * meters * metersLng(p[0]);
    // Jamais inland da âncora seca (avenida)
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
    return clampBay(p[0] + (h[0] - p[0]) * t, p[1] + (h[1] - p[1]) * t);
  });
}

function closedBand(seaSide: Array<[number, number]>, landSide: Array<[number, number]>) {
  return [...seaSide, ...[...landSide].reverse()];
}

const DRY_DENSE = densify(DRY_WALL, 5);
const SHORE_LOW = projectFromDry(DRY_DENSE, LOW_TIDE_M);
const SHORE_HIGH = projectFromDry(DRY_DENSE, HIGH_TIDE_M);

/**
 * Contorno oceano da baía — só água.
 * Oeste: desce no mar aberto (sem canal/cidade).
 * Leste: sobe até a base do Morro da Pescaria na água (píer/golfinho), sem terra do parque.
 */
function oceanBasin(shore: Array<[number, number]>): Array<[number, number]> {
  const westTip = shore[0];
  const eastTip = shore[shore.length - 1];
  const west = Math.max(BAY_LNG_WEST, Math.min(westTip[1] + 0.00015, -40.4955));
  const east = Math.min(BAY_LNG_EAST, Math.max(eastTip[1] + 0.00035, -40.47415));

  // Costão da Pescaria: água até a base (píer ~-40.4743), sem subir no parque
  const eastArc: Array<[number, number]> = [
    [eastTip[0] - 0.00035, east],
    [-20.65455, -40.47405],
    [-20.65555, -40.47392],
    [-20.65615, -40.47395], // base do píer / golfinho na água
    [-20.65705, -40.47415],
    [-20.65835, -40.47455],
    [-20.6602, -40.47535],
    [-20.6628, -40.4770],
    [-20.6658, -40.4796],
    [-20.6685, -40.4832],
    [OCEAN_SOUTH + 0.002, -40.4880],
    [OCEAN_SOUTH, -40.4910],
  ];

  // Oeste: curva no mar aberto — sem parede vertical cortando a cidade
  const westArc: Array<[number, number]> = [
    [OCEAN_SOUTH, -40.4938],
    [OCEAN_SOUTH + 0.0025, west + 0.0004],
    [-20.6688, west + 0.00015],
    [-20.6655, west],
    [-20.6628, west],
    [westTip[0] - 0.0012, Math.max(westTip[1], west)],
  ];

  return [...shore, ...eastArc, ...westArc];
}

/**
 * Intensidade do calor na areia (0–1) pela hora local (Guarapari ≈ America/Sao_Paulo).
 * Pico ~13h; noite quase apagado.
 */
export function sunHeatFactor(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 12);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const hour = h + m / 60;
  if (hour < 5.5 || hour > 18.5) return 0.1;
  const peak = 13;
  return Math.max(0.2, Math.min(1, 1 - Math.abs(hour - peak) / 7.2));
}

/** Ângulo aproximado da luz (graus) pela hora — manhã do leste, tarde do oeste. */
export function sunAzimuthDeg(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 12);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const hour = h + m / 60;
  // 6h → ~80°, 12h → 180°, 18h → ~280°
  return 80 + ((Math.min(18, Math.max(6, hour)) - 6) / 12) * 200;
}

/**
 * Sol = máscara térmica SÓ na faixa de areia (não oceano, não cidade).
 * Três anéis concêntricos (wash → mid → core) substituem blur CSS
 * (blur em path SVG preenche a bbox e vaza para o mar/cidade).
 */
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

/** @deprecated use sunSandRings().core */
export function sunSandCore(): Array<[number, number]> {
  return sunSandRings().core;
}

/** @deprecated use sunSandBand */
export function sunBand() {
  return sunSandBand();
}

/**
 * Maré: borda da areia dinâmica (API) + bacia oceânica fixa só na água.
 * Soft = anéis seaward (sem blur CSS — blur em path SVG vaza pela bbox).
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
    body: oceanBasin(shore),
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
