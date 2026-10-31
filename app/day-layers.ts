/** Camadas visuais do dia no mapa — Sol e Maré (sem vento). */

export type DayLayer = "off" | "sol" | "mare";

export const DAY_LAYER_CHIPS: { id: DayLayer; label: string; emoji: string }[] = [
  { id: "off", label: "Limpo", emoji: "🗺️" },
  { id: "sol", label: "Sol", emoji: "☀️" },
  { id: "mare", label: "Maré", emoji: "🌊" },
];

/**
 * Âncoras na areia (junto aos quiosques), sul → crescente norte.
 * Cidade/avenida fica a oeste (orla) ou norte (crescente).
 * Mar = sudeste via normal local — nunca misturar eixos à mão.
 */
const SAND_ANCHORS: Array<[number, number]> = [
  // areia / quiosques (sem extensão inland — cria cunha)
  [-20.6608, -40.4963],
  [-20.6604, -40.4958],
  [-20.6600, -40.4953],
  [-20.6596, -40.49485],
  [-20.6593, -40.4944],
  [-20.6589, -40.49385],
  [-20.6585, -40.4933],
  [-20.6580, -40.49265],
  [-20.6575, -40.4920],
  [-20.65715, -40.49155],
  [-20.6568, -40.4911],
  [-20.6565, -40.4906],
  [-20.6562, -40.4901],
  [-20.65575, -40.48955],
  [-20.6553, -40.4890],
  [-20.65505, -40.4885],
  [-20.6548, -40.4880],
  [-20.6546, -40.48755],
  [-20.6544, -40.4871],
  [-20.65415, -40.4866],
  [-20.6539, -40.4861],
  [-20.6537, -40.4856],
  [-20.6535, -40.4851],
  [-20.6533, -40.4846],
  [-20.6531, -40.4841],
  [-20.6529, -40.48355],
  [-20.6527, -40.4830],
  [-20.65255, -40.4824],
  [-20.6524, -40.4818],
  // crescente — mar ao sul
  [-20.65238, -40.48115],
  [-20.65235, -40.4805],
  [-20.65237, -40.4798],
  [-20.6524, -40.4791],
  [-20.65248, -40.4784],
  [-20.65255, -40.4777],
  [-20.6527, -40.4771],
  [-20.65285, -40.4765],
  [-20.65302, -40.4761],
  [-20.6532, -40.4757],
  [-20.6534, -40.47545],
  [-20.6536, -40.4752],
];

/** Oceano longe o bastante para o tampão sumir da tela em zoom de orla. */
const OCEAN_REACH_M = 2400;
/** Franja de feathering na areia (metros) — sobreposta ao corpo. */
const FEATHER_M = 22;

const METERS_LAT = 1 / 111_320;

function metersLng(lat: number) {
  return 1 / (111_320 * Math.cos((lat * Math.PI) / 180));
}

/** Interpola âncoras → dezenas de pontos na curva côncava da areia. */
function densify(anchors: Array<[number, number]>, perSeg = 4): Array<[number, number]> {
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

/**
 * Normal seaward em metros (north, east).
 * Andando sul→norte com mar à direita: rotaciona tangente 90° CW → mar.
 * Orla (rumo N/NE) → leste/sudeste; crescente (rumo E) → sul.
 */
function seawardNE(prev: [number, number], next: [number, number], lat: number): [number, number] {
  const tN = (next[0] - prev[0]) / METERS_LAT;
  const tE = (next[1] - prev[1]) / metersLng(lat);
  // (east, north)=(tE,tN); CW 90° → (tN, -tE) como (east', north')
  let nE = tN;
  let nN = -tE;
  const len = Math.hypot(nN, nE);
  if (len < 1e-6) return [-0.35, 0.94]; // sudeste
  return [nN / len, nE / len];
}

function projectSeaward(shore: Array<[number, number]>, meters: number): Array<[number, number]> {
  return shore.map((p, i) => {
    const prev = shore[Math.max(0, i - 1)];
    const next = shore[Math.min(shore.length - 1, i + 1)];
    let [nN, nE] = seawardNE(prev, next, p[0]);
    // Na ponta do crescente a tangente vira SE e a normal CW aponta inland.
    // Força componente leste mínima; no crescente prioriza sul.
    if (nE < 0.25) {
      nE = 0.4;
      nN = p[1] > -40.4825 ? -0.92 : Math.min(nN, -0.2);
      const len = Math.hypot(nN, nE);
      nN /= len;
      nE /= len;
    }
    let lat = p[0] + nN * meters * METERS_LAT;
    let lng = p[1] + nE * meters * metersLng(p[0]);
    // Trava urbana: jamais oeste da âncora; no crescente jamais norte da âncora.
    lng = Math.max(lng, p[1] + 10 * metersLng(p[0]));
    if (p[1] > -40.4825) {
      lat = Math.min(lat, p[0] - 10 * METERS_LAT);
    }
    return [lat, lng] as [number, number];
  });
}

function closedBand(seaSide: Array<[number, number]>, landSide: Array<[number, number]>): Array<[number, number]> {
  return [...seaSide, ...[...landSide].reverse()];
}

/**
 * Metros a partir dos quiosques até a linha da maré na areia.
 * Sempre >= 16 → margem antes da avenida/calçadão.
 */
function shoreFromKiosk(ratio: number) {
  const t = Math.min(1, Math.max(0, ratio));
  // 50 m (vazante) → 20 m (preamar). Margem p/ blur + areia molhada.
  return 50 - t * 30;
}

const SHORE_DENSE = densify(SAND_ANCHORS, 4);

export function sunBand(): Array<[number, number]> {
  return closedBand(projectSeaward(SHORE_DENSE, 48), projectSeaward(SHORE_DENSE, 4));
}

/**
 * Polígonos da maré.
 * A — oceano: reach 2400 m (fora da tela; sem corte reto no meio da água).
 * B — limite urbano: shore >= 16 m seaward das âncoras na areia.
 * Feather: faixa estreita na areia com blur extremo no CSS.
 */
export function tideLayers(ratio: number) {
  const shoreM = shoreFromKiosk(ratio);
  const featherM = shoreM + FEATHER_M;
  const midM = shoreM + 160;
  const deepM = shoreM + OCEAN_REACH_M;

  const shore = projectSeaward(SHORE_DENSE, shoreM);
  const feather = projectSeaward(SHORE_DENSE, featherM);
  const mid = projectSeaward(SHORE_DENSE, midM);
  const deep = projectSeaward(SHORE_DENSE, deepM);

  return {
    /** Corpo contínuo: areia → oceano aberto (fora da tela). */
    body: closedBand(deep, shore),
    /** Véu na areia — blur CSS ~22px (feathering). */
    soft: closedBand(feather, shore),
    /** Reforço médio perto da rebentação. */
    mid: closedBand(mid, feather),
  };
}

/** @deprecated use tideLayers */
export function tideOceanBand(ratio: number) {
  return tideLayers(ratio).body;
}
export function tideWaterBand(ratio: number) {
  return tideLayers(ratio).mid;
}
export function tideWetSandBand(ratio: number) {
  return tideLayers(ratio).soft;
}
export function tideEdgeLine(ratio: number) {
  return projectSeaward(SHORE_DENSE, shoreFromKiosk(ratio));
}
export function tideSurfLine(ratio: number = 0.45) {
  return projectSeaward(SHORE_DENSE, shoreFromKiosk(ratio) + 180);
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
