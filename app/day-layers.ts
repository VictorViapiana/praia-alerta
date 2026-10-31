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
 */
const DRY_WALL: Array<[number, number]> = [
  [-20.6608, -40.49605],
  [-20.6600, -40.4952],
  [-20.6593, -40.4943],
  [-20.6585, -40.4932],
  [-20.6575, -40.49195],
  [-20.6568, -40.49105],
  [-20.6562, -40.49005],
  [-20.6553, -40.48895],
  [-20.6548, -40.48795],
  [-20.6544, -40.48705],
  [-20.6539, -40.48605],
  [-20.6535, -40.48505],
  [-20.6531, -40.48405],
  [-20.6527, -40.4830],
  [-20.6524, -40.4818],
  [-20.65235, -40.4805],
  [-20.6524, -40.47915],
  [-20.65255, -40.47775],
  [-20.65285, -40.47655],
  [-20.6532, -40.47575],
  [-20.65355, -40.47525],
];

/** Metros seaward: vazante → preamar (ainda na areia). */
const LOW_TIDE_M = 52;
const HIGH_TIDE_M = 18;
const FEATHER_M = 14;

/** Faixa de areia para o Sol (não oceano, não avenida). */
const SAND_LAND_M = 3;
const SAND_SEA_M = 36;

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

/**
 * Sol ativo só de dia: 05:30 ≤ hora < 17:30.
 * Fora disso (noite / madrugada) → false — camada NÃO renderiza.
 */
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

/**
 * Empurra a parede seca para o mar.
 * Sem bounding-box lateral — só trava inland (nunca avenida).
 */
function projectFromDry(dry: Array<[number, number]>, meters: number): Array<[number, number]> {
  return dry.map((p, i) => {
    const prev = dry[Math.max(0, i - 1)];
    const next = dry[Math.min(dry.length - 1, i + 1)];
    let [nN, nE] = seawardNE(prev, next, p[0]);
    // No crescente leste, força componente sul (água), nunca inland no morro
    if (nE < 0.18) {
      nE = 0.4;
      nN = Math.min(nN, -0.8);
      const len = Math.hypot(nN, nE);
      nN /= len;
      nE /= len;
    }
    let lat = p[0] + nN * meters * METERS_LAT;
    let lng = p[1] + nE * meters * metersLng(p[0]);
    // Jamais inland da âncora seca
    lng = Math.max(lng, p[1] + 6 * metersLng(p[0]));
    if (p[1] > -40.482) {
      lat = Math.min(lat, p[0] - 6 * METERS_LAT);
    }
    // Ponta oeste: não entra no canal (fica a leste da península)
    if (p[1] < -40.4945) {
      lng = Math.max(lng, -40.4957);
    }
    // Ponta leste: não sobe no Morro da Pescaria (fica a oeste da mata)
    if (p[1] > -40.477) {
      lng = Math.min(lng, -40.47455);
    }
    return [lat, lng] as [number, number];
  });
}

function lerpShore(low: Array<[number, number]>, high: Array<[number, number]>, ratio: number) {
  const t = Math.min(1, Math.max(0, ratio));
  return low.map((p, i) => {
    const h = high[i] ?? p;
    return [p[0] + (h[0] - p[0]) * t, p[1] + (h[1] - p[1]) * t] as [number, number];
  });
}

function closedBand(seaSide: Array<[number, number]>, landSide: Array<[number, number]>) {
  return [...seaSide, ...[...landSide].reverse()];
}

const DRY_DENSE = densify(DRY_WALL, 6);
const SHORE_LOW = projectFromDry(DRY_DENSE, LOW_TIDE_M);
const SHORE_HIGH = projectFromDry(DRY_DENSE, HIGH_TIDE_M);

/**
 * Contorno oceano côncavo da Praia do Morro — SÓ água.
 * Densidade alta nas laterais para contornar:
 *  - oeste: península/cidade/canal (fica no mar, a leste da terra)
 *  - leste: Morro da Pescaria verde (fica no mar, a oeste da mata)
 * Sem bounding-box retangular.
 */
function oceanBasin(shore: Array<[number, number]>): Array<[number, number]> {
  const westTip = shore[0];
  const eastTip = shore[shore.length - 1];

  // Leste: areia → água na base do costão (píer/golfinho) → contorna o morro verde sem subir nele
  const eastCoast: Array<[number, number]> = [
    [eastTip[0] - 0.0002, Math.min(eastTip[1] + 0.00015, -40.47485)],
    [-20.65405, -40.47465],
    [-20.65465, -40.4744],
    [-20.65535, -40.4742],
    [-20.65595, -40.47405], // água ao sul do golfinho (não na praça)
    [-20.65655, -40.47395],
    [-20.65725, -40.47405],
    [-20.65795, -40.47435],
    [-20.65875, -40.47475],
    [-20.65965, -40.4753],
    [-20.66065, -40.47605],
    [-20.66175, -40.4770],
    [-20.66295, -40.4782],
    [-20.66425, -40.47955],
    [-20.66565, -40.4812],
    [-20.66705, -40.48305],
    [-20.66835, -40.4852],
    [-20.6694, -40.48755],
    [-20.67025, -40.4900],
    [-20.67085, -40.49225],
  ];

  // Oeste: sobe do oceano → contorna a península urbana no mar (sem canal/cidade)
  const westCoast: Array<[number, number]> = [
    [-20.67075, -40.49355],
    [-20.67015, -40.49455],
    [-20.66925, -40.49525],
    [-20.66815, -40.49565],
    [-20.66685, -40.49585],
    [-20.66545, -40.4959],
    [-20.66405, -40.49585],
    [-20.66275, -40.49575],
    [-20.66155, -40.49565],
    [-20.66045, -40.49555],
    [westTip[0] - 0.00055, Math.max(westTip[1], -40.49555)],
  ];

  return densify([...shore, ...eastCoast, ...westCoast], 2);
}

/**
 * Intensidade do calor na areia (0–1).
 * Fora de 05:30–17:30 → 0 (sem efeito noturno).
 */
export function sunHeatFactor(now = new Date()) {
  if (!isSunActive(now)) return 0;
  const hour = localHourSaoPaulo(now);
  const peak = 13;
  return Math.max(0.25, Math.min(1, 1 - Math.abs(hour - peak) / 7));
}

/** Ângulo aproximado da luz (graus) — só faz sentido com Sol ativo. */
export function sunAzimuthDeg(now = new Date()) {
  const hour = localHourSaoPaulo(now);
  return 80 + ((Math.min(SUN_OFF_HOUR, Math.max(SUN_ON_HOUR, hour)) - SUN_ON_HOUR) / (SUN_OFF_HOUR - SUN_ON_HOUR)) * 200;
}

/**
 * Sol = máscara térmica SÓ na faixa de areia.
 * Três anéis (wash → mid → core) sem blur CSS.
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
 * Maré: borda da areia dinâmica (API) + bacia oceânica côncava só na água.
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
