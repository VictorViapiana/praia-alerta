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
 * Parede seca (quiosques / calçadão) — só para a borda N da maré na areia.
 * Pontas já dentro da baía (longe de Muquiçaba e do verde da Pescaria).
 */
const DRY_WALL: Array<[number, number]> = [
  [-20.6597, -40.49355],
  [-20.65905, -40.4930],
  [-20.65835, -40.49225],
  [-20.65755, -40.4913],
  [-20.6568, -40.4904],
  [-20.6562, -40.4896],
  [-20.6556, -40.48875],
  [-20.65485, -40.4879],
  [-20.6544, -40.48705],
  [-20.6540, -40.4862],
  [-20.6536, -40.48525],
  [-20.6532, -40.4843],
  [-20.65285, -40.48335],
  [-20.65255, -40.4824],
  [-20.65235, -40.4813],
  [-20.6523, -40.4802],
  [-20.65235, -40.47905],
  [-20.65255, -40.4779],
  [-20.6529, -40.4768],
  [-20.6533, -40.47585],
  [-20.6537, -40.47515],
];

/** Metros seaward: vazante → preamar (ainda na areia). */
const LOW_TIDE_M = 48;
const HIGH_TIDE_M = 14;
const FEATHER_M = 11;

const SAND_LAND_M = 3;
const SAND_SEA_M = 34;

/**
 * ANEL FIXO DA BAÍA — só água.
 * Vértices insetos ~20–40 m para DENTRO DO MAR a partir da linha d'água.
 * Oeste: longe de telhados/ruas de Muquiçaba.
 * Leste: longe do verde do Morro da Pescaria, sem buraco no mar.
 * Norte: substituído dinamicamente pela shore da API.
 */
const BAY_EAST: Array<[number, number]> = [
  [-20.6537, -40.47505],
  [-20.6542, -40.47455],
  [-20.6547, -40.47425], // NE: água antes dos bancos — sem subir na areia/verde
  [-20.6553, -40.4742],
  [-20.6559, -40.47435],
  [-20.6564, -40.47455], // oeste do píer/golfinho (só água)
  [-20.6571, -40.47485],
  [-20.6579, -40.47525],
  [-20.6587, -40.47575],
  [-20.6596, -40.4764],
  [-20.6606, -40.4772],
  [-20.6617, -40.47815],
  [-20.6629, -40.47925],
  [-20.6641, -40.4805],
  [-20.6653, -40.48195],
  [-20.6664, -40.48365],
  [-20.66735, -40.48555],
  [-20.6681, -40.48755],
  [-20.66865, -40.48945],
];

const BAY_SOUTH: Array<[number, number]> = [
  [-20.66875, -40.4899],
  [-20.66895, -40.4907],
  [-20.66895, -40.49145],
  [-20.6687, -40.4921],
  [-20.6683, -40.49265],
];

/** Oeste N→S: água a LESTE — inset da península/cidade. */
const BAY_WEST: Array<[number, number]> = [
  [-20.6590, -40.49325],
  [-20.6600, -40.49305],
  [-20.6612, -40.4928],
  [-20.6624, -40.4925],
  [-20.6636, -40.49215],
  [-20.6648, -40.49175],
  [-20.6659, -40.4914],
  [-20.66685, -40.4912],
  [-20.6676, -40.49155],
  [-20.6682, -40.49215],
  [-20.6685, -40.4927],
];

const METERS_LAT = 1 / 111_320;

function metersLng(lat: number) {
  return 1 / (111_320 * Math.cos((lat * Math.PI) / 180));
}

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

/** Interpola lng da costa na latitude (linha N→S). */
function coastLngAt(line: Array<[number, number]>, lat: number) {
  if (lat >= line[0][0]) return line[0][1];
  if (lat <= line[line.length - 1][0]) return line[line.length - 1][1];
  for (let i = 0; i < line.length - 1; i++) {
    const [aLat, aLng] = line[i];
    const [bLat, bLng] = line[i + 1];
    if (lat <= aLat && lat >= bLat) {
      const t = (aLat - lat) / (aLat - bLat + 1e-12);
      return aLng + (bLng - aLng) * t;
    }
  }
  return line[0][1];
}

/**
 * Clip estrito: azul só na água.
 * Oeste → a leste de BAY_WEST (longe da cidade).
 * Leste → a oeste de BAY_EAST (longe do morro).
 */
function clipToBayWater(lat: number, lng: number): [number, number] {
  const westLimit = coastLngAt(BAY_WEST, lat);
  const eastLimit = coastLngAt(BAY_EAST, lat);
  let next = lng;
  if (next < westLimit) next = westLimit;
  if (next > eastLimit) next = eastLimit;
  return [lat, next];
}

function projectFromDry(dry: Array<[number, number]>, meters: number): Array<[number, number]> {
  return dry.map((p, i) => {
    const prev = dry[Math.max(0, i - 1)];
    const next = dry[Math.min(dry.length - 1, i + 1)];
    let [nN, nE] = seawardNE(prev, next, p[0]);
    if (nE < 0.22) {
      nE = 0.45;
      nN = Math.min(nN, -0.82);
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
    return clipToBayWater(lat, lng);
  });
}

function lerpShore(low: Array<[number, number]>, high: Array<[number, number]>, ratio: number) {
  const t = Math.min(1, Math.max(0, ratio));
  return low.map((p, i) => {
    const h = high[i] ?? p;
    return clipToBayWater(p[0] + (h[0] - p[0]) * t, p[1] + (h[1] - p[1]) * t);
  });
}

function closedBand(seaSide: Array<[number, number]>, landSide: Array<[number, number]>) {
  return [...seaSide, ...[...landSide].reverse()];
}

const DRY_DENSE = densify(DRY_WALL, 6);
const SHORE_LOW = projectFromDry(DRY_DENSE, LOW_TIDE_M);
const SHORE_HIGH = projectFromDry(DRY_DENSE, HIGH_TIDE_M);

const EAST_DENSE = densify(BAY_EAST, 4);
const SOUTH_DENSE = densify(BAY_SOUTH, 3);
const WEST_DENSE = densify(BAY_WEST, 4);

/**
 * Corpo da maré = borda N dinâmica (API) + costas fixas só na água.
 * Laterais e sul vêm do anel BAY_* (nunca cidade, nunca morro).
 */
function bayWaterPolygon(shore: Array<[number, number]>): Array<[number, number]> {
  const shoreClipped = shore.map(([lat, lng]) => clipToBayWater(lat, lng));
  const eastCoast = EAST_DENSE.map(([lat, lng]) => clipToBayWater(lat, lng));
  const south = SOUTH_DENSE.map(([lat, lng]) => clipToBayWater(lat, lng));
  const westCoast = [...WEST_DENSE].reverse().map(([lat, lng]) => clipToBayWater(lat, lng));
  return [...shoreClipped, ...eastCoast, ...south, ...westCoast];
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
export function sunSandCore(): Array<[number, number]> {
  return sunSandRings().core;
}
export function sunBand() {
  return sunSandBand();
}

/**
 * Maré: borda Noroeste (areia) = lerp EXCLUSIVO da ratio da API ao vivo.
 * Corpo = água da baía com laterais fixas na linha d'água (inset).
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
    body: bayWaterPolygon(shore),
    soft: closedBand(softFar, shore).map(([lat, lng]) => clipToBayWater(lat, lng)),
    softInner: closedBand(softNear, shore).map(([lat, lng]) => clipToBayWater(lat, lng)),
  };
}

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

/** Ratio AO VIVO da API — null se dado inválido (sem mock). */
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
