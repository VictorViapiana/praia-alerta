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
 * Parede seca (quiosques / calçadão) — borda inland da areia.
 * Usada só para a borda N dinâmica e para o Sol.
 */
const DRY_WALL: Array<[number, number]> = [
  [-20.6599, -40.4939],
  [-20.6592, -40.4933],
  [-20.6585, -40.4925],
  [-20.6577, -40.49155],
  [-20.65695, -40.4906],
  [-20.65635, -40.48975],
  [-20.65575, -40.4889],
  [-20.65495, -40.4880],
  [-20.6545, -40.48715],
  [-20.6541, -40.4863],
  [-20.6537, -40.48535],
  [-20.6533, -40.4844],
  [-20.65295, -40.4834],
  [-20.65265, -40.4824],
  [-20.6524, -40.48125],
  [-20.65232, -40.4801],
  [-20.65238, -40.47895],
  [-20.65255, -40.4778],
  [-20.6529, -40.4767],
  [-20.6533, -40.47575],
  [-20.6537, -40.47505],
];

/** Metros seaward na areia: vazante → preamar. */
const LOW_TIDE_M = 48;
const HIGH_TIDE_M = 12;
const FEATHER_M = 11;

const SAND_LAND_M = 3;
const SAND_SEA_M = 34;

/**
 * Costa LESTE (Pescaria) N→S — água a OESTE.
 * Encosta na linha d'água antes do morro (fecha o buraco), sem verde.
 */
const BAY_EAST: Array<[number, number]> = [
  [-20.6537, -40.4749],
  [-20.6542, -40.47445],
  [-20.65465, -40.4742],
  [-20.65515, -40.4741],
  [-20.6557, -40.4743],
  [-20.65615, -40.4745], // água a oeste do píer/golfinho
  [-20.65655, -40.47465],
  [-20.6572, -40.47495],
  [-20.65795, -40.47525],
  [-20.65875, -40.4758],
  [-20.6596, -40.47645],
  [-20.66055, -40.47725],
  [-20.6616, -40.4782],
  [-20.66275, -40.4793],
  [-20.66395, -40.48055],
  [-20.66515, -40.4820],
  [-20.66625, -40.48365],
  [-20.6672, -40.48555],
  [-20.6680, -40.48755],
  [-20.66855, -40.4894],
];

/** Arco sul — oceano aberto. */
const BAY_SOUTH: Array<[number, number]> = [
  [-20.66865, -40.48985],
  [-20.6689, -40.49065],
  [-20.66895, -40.4914],
  [-20.66875, -40.49205],
  [-20.6684, -40.4926],
];

/**
 * Costa OESTE (Muquiçaba) N→S — água a LESTE.
 * Logo a leste da linha d'água da península (sem telhado/rua).
 */
const BAY_WEST: Array<[number, number]> = [
  [-20.65915, -40.49405],
  [-20.6601, -40.4939],
  [-20.6612, -40.4937],
  [-20.66235, -40.4935],
  [-20.6635, -40.49315],
  [-20.66465, -40.4927],
  [-20.6657, -40.49225],
  [-20.66665, -40.4919],
  [-20.66745, -40.49195],
  [-20.66805, -40.49235],
  [-20.6684, -40.49265],
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

/** Clip: azul só entre as costas oeste/leste (água). */
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

const EAST_DENSE = densify(BAY_EAST, 5);
const SOUTH_DENSE = densify(BAY_SOUTH, 3);
const WEST_DENSE = densify(BAY_WEST, 5);

/**
 * Corpo = toda a água da baía até a areia (borda N = preamar / perto da areia).
 * Laterais fixas na linha d'água. Sem buraco no mar, sem cidade/morro.
 */
function bayWaterPolygon(shoreNearSand: Array<[number, number]>): Array<[number, number]> {
  const north = shoreNearSand.map(([lat, lng]) => clipToBayWater(lat, lng));
  const east = EAST_DENSE.map(([lat, lng]) => clipToBayWater(lat, lng));
  const south = SOUTH_DENSE.map(([lat, lng]) => clipToBayWater(lat, lng));
  const west = [...WEST_DENSE].reverse().map(([lat, lng]) => clipToBayWater(lat, lng));
  return [...north, ...east, ...south, ...west];
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
 * Maré:
 * - body: SEMPRE até a areia (SHORE_HIGH) + laterais na linha d'água → sem buraco na baía.
 * - soft: faixa dinâmica (API) entre vazante e preamar na areia.
 */
export function tideLayers(ratio: number) {
  const t = Math.min(1, Math.max(0, ratio));
  const shoreDynamic = lerpShore(SHORE_LOW, SHORE_HIGH, t);
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
    body: bayWaterPolygon(SHORE_HIGH),
    soft: closedBand(softFar, shoreDynamic).map(([lat, lng]) => clipToBayWater(lat, lng)),
    softInner: closedBand(softNear, shoreDynamic).map(([lat, lng]) => clipToBayWater(lat, lng)),
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
