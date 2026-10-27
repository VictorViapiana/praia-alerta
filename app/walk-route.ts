export type TravelMode = "foot" | "bike" | "car";

export type WalkPoint = { id?: string; lat: number; lng: number; name: string };

export type WalkStep = {
  text: string;
  speech: string;
  instruction: string;
  street: string;
  modifier: string;
  meters: number;
  along?: number;
  at?: { lat: number; lng: number };
};

export type RouteProgress = {
  offMeters: number;
  traveledMeters: number;
  remainingMeters: number;
  snapped: { lat: number; lng: number };
  traveledLine: [number, number][];
  remainingLine: [number, number][];
};

export const OFF_ROUTE: Record<TravelMode, number> = {
  foot: 45,
  bike: 60,
  car: 80,
};

export const CALL_OUT: Record<TravelMode, { far?: number; near: number }> = {
  foot: { near: 24 },
  bike: { far: 90, near: 32 },
  car: { far: 200, near: 50 },
};

export type WalkRoute = {
  meters: number;
  seconds: number;
  arrivalLabel: string;
  steps: WalkStep[];
  line: [number, number][];
  via: "ruas" | "linha";
};

const TURN: Record<string, string> = {
  left: "vire à esquerda",
  right: "vire à direita",
  "slight left": "siga levemente à esquerda",
  "slight right": "siga levemente à direita",
  "sharp left": "vire fechado à esquerda",
  "sharp right": "vire fechado à direita",
  straight: "siga em frente",
  uturn: "faça o retorno",
};

const PROFILE: Record<TravelMode, string> = {
  foot: "foot",
  bike: "bike",
  car: "driving",
};

const SPEED: Record<TravelMode, number> = {
  foot: 1.25,
  bike: 4.2,
  car: 8.3,
};

export function modeLabel(mode: TravelMode) {
  if (mode === "foot") return "A pé";
  if (mode === "bike") return "Bicicleta";
  return "Carro";
}

export function routeSurface(mode: TravelMode, via: WalkRoute["via"]) {
  if (via === "linha") return "Linha direta. O traçado das ruas não carregou.";
  if (mode === "foot") return "A pé, nos dois sentidos, pelo calçadão e pelas ruas.";
  if (mode === "bike") return "De bicicleta, pelas ruas e ciclovias.";
  return "De carro, na mão da via.";
}

export function formatDistance(meters: number) {
  if (meters < 950) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

export function formatWalk(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function arrivalLabel(seconds: number) {
  return new Date(Date.now() + seconds * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function metersBetween(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const radius = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(a)));
}

function sentence(value: string) {
  const text = value.trim();
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function stepCopy(
  step: { maneuver?: { type?: string; modifier?: string; location?: [number, number] }; name?: string; distance?: number },
  mode: TravelMode,
  stopName?: string,
): WalkStep | null {
  const type = step.maneuver?.type;
  const modifier = step.maneuver?.modifier ?? "";
  const name = step.name?.trim();
  const meters = step.distance ?? 0;
  const at = step.maneuver?.location ? { lng: step.maneuver.location[0], lat: step.maneuver.location[1] } : undefined;
  const ahead = meters >= 30 ? `Daqui a ${formatDistance(meters)}, ` : "";
  const street = name ? ` em ${name}` : "";
  const turn = TURN[modifier] ?? "continue";

  if (type === "arrive") {
    if (!stopName) return null;
    return {
      text: `Parada: ${stopName}`,
      speech: sentence(`Chegamos na parada, ${stopName}`),
      instruction: "Parada",
      street: stopName,
      modifier: "arrive",
      meters,
      at,
    };
  }

  if (type === "depart") {
    const verb = mode === "car" ? "Siga de carro" : mode === "bike" ? "Pode pedalar" : "Pode ir andando";
    const text = name ? `${verb} por ${name}` : mode === "car" ? "Comece a dirigir" : mode === "bike" ? "Comece a pedalar" : "Comece a andar";
    return { text, speech: sentence(text), instruction: "Siga em frente", street: name ?? "", modifier: "depart", meters, at };
  }

  if (type === "roundabout" || type === "rotary") {
    const text = `${ahead}entre na rotatória${street}`;
    return {
      text: text.charAt(0).toUpperCase() + text.slice(1),
      speech: sentence(text),
      instruction: "Entre na rotatória",
      street: name ?? "",
      modifier: "roundabout",
      meters,
      at,
    };
  }

  const instruction = (TURN[modifier] ?? "continue").replace(/^./, (letter) => letter.toUpperCase());
  const text = `${ahead}${turn}${street}`;
  return {
    text: text.charAt(0).toUpperCase() + text.slice(1),
    speech: sentence(text),
    instruction,
    street: name ?? "",
    modifier: modifier || "straight",
    meters,
    at,
  };
}

function straight(points: { lat: number; lng: number }[], mode: TravelMode): WalkRoute {
  let meters = 0;
  for (let index = 1; index < points.length; index += 1) meters += metersBetween(points[index - 1], points[index]);
  const seconds = meters / SPEED[mode];
  return {
    meters,
    seconds,
    arrivalLabel: arrivalLabel(seconds),
    steps: [{
      text: "Linha direta. O caminho pelas ruas não carregou.",
      speech: "O caminho pelas ruas não carregou. Siga em linha direta.",
      instruction: "Siga em frente",
      street: "",
      modifier: "straight",
      meters,
    }],
    line: points.map((point) => [point.lat, point.lng]),
    via: "linha",
  };
}

export function routeIntro(route: WalkRoute, mode: TravelMode, name: string) {
  const how = mode === "foot" ? "A pé" : mode === "bike" ? "De bicicleta" : "De carro";
  const first = route.steps[0]?.speech ?? "";
  return `${how} até ${name}. ${formatDistance(route.meters)}, cerca de ${formatWalk(route.seconds)}. ${routeSurface(mode, route.via)} ${first}`;
}

export async function planRoute(points: { lat: number; lng: number; name?: string }[], mode: TravelMode, signal?: AbortSignal): Promise<WalkRoute> {
  if (points.length < 2) return straight(points, mode);
  const path = points.map((point) => `${point.lng},${point.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/${PROFILE[mode]}/${path}?overview=full&geometries=geojson&steps=true`;
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) return straight(points, mode);
    const data = (await response.json()) as {
      routes?: {
        distance: number;
        duration: number;
        geometry?: { coordinates?: [number, number][] };
        legs?: { steps?: { distance: number; name?: string; maneuver?: { type?: string; modifier?: string; location?: [number, number] } }[] }[];
      }[];
    };
    const route = data.routes?.[0];
    const coords = route?.geometry?.coordinates;
    if (!route || !coords?.length) return straight(points, mode);
    const stopNames = points.slice(1, -1).map((point) => point.name ?? "parada");
    const steps: WalkStep[] = [];
    (route.legs ?? []).forEach((leg, legIndex) => {
      const stopName = legIndex < stopNames.length ? stopNames[legIndex] : undefined;
      for (const step of leg.steps ?? []) {
        const copy = stepCopy(step, mode, step.maneuver?.type === "arrive" ? stopName : undefined);
        if (copy) steps.push(copy);
      }
    });
    const line = coords.map(([lng, lat]) => [lat, lng] as [number, number]);
    return {
      meters: route.distance,
      seconds: route.duration,
      arrivalLabel: arrivalLabel(route.duration),
      steps: placeSteps(steps, line),
      line,
      via: "ruas",
    };
  } catch (error) {
    if (signal?.aborted) throw error;
    return straight(points, mode);
  }
}

function toXY(origin: { lat: number; lng: number }, point: { lat: number; lng: number }) {
  const lat0 = (origin.lat * Math.PI) / 180;
  return {
    x: ((point.lng - origin.lng) * Math.PI) / 180 * 6371000 * Math.cos(lat0),
    y: ((point.lat - origin.lat) * Math.PI) / 180 * 6371000,
  };
}

export function followRoute(point: { lat: number; lng: number }, line: [number, number][]): RouteProgress {
  if (line.length === 0) {
    return { offMeters: 0, traveledMeters: 0, remainingMeters: 0, snapped: point, traveledLine: [], remainingLine: [] };
  }
  const only = { lat: line[0][0], lng: line[0][1] };
  if (line.length === 1) {
    return {
      offMeters: metersBetween(point, only),
      traveledMeters: 0,
      remainingMeters: 0,
      snapped: only,
      traveledLine: line,
      remainingLine: line,
    };
  }

  const xy = line.map(([lat, lng]) => toXY(only, { lat, lng }));
  const cursor = toXY(only, point);
  let best = Infinity;
  let bestIndex = 0;
  let bestT = 0;
  let bestAt = 0;
  let total = 0;

  for (let index = 1; index < xy.length; index += 1) {
    const ax = xy[index - 1].x;
    const ay = xy[index - 1].y;
    const bx = xy[index].x;
    const by = xy[index].y;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const len = Math.sqrt(len2);
    let t = 0;
    if (len2 > 0.01) t = Math.max(0, Math.min(1, ((cursor.x - ax) * dx + (cursor.y - ay) * dy) / len2));
    const dist = Math.hypot(cursor.x - (ax + dx * t), cursor.y - (ay + dy * t));
    const traveled = total + len * t;
    total += len;
    if (dist < best) {
      best = dist;
      bestIndex = index - 1;
      bestT = t;
      bestAt = traveled;
    }
  }

  const start = line[bestIndex];
  const end = line[bestIndex + 1];
  const snapped: [number, number] = [start[0] + (end[0] - start[0]) * bestT, start[1] + (end[1] - start[1]) * bestT];
  return {
    offMeters: best,
    traveledMeters: bestAt,
    remainingMeters: Math.max(0, total - bestAt),
    snapped: { lat: snapped[0], lng: snapped[1] },
    traveledLine: [...line.slice(0, bestIndex + 1), snapped],
    remainingLine: [snapped, ...line.slice(bestIndex + 1)],
  };
}

export function nextManeuvers(route: WalkRoute, traveled: number, count = 2) {
  const hasTurn = route.steps.some((step) => step.modifier !== "depart" && step.at);
  const list: { instruction: string; street: string; modifier: string; meters: number }[] = [];
  for (const step of route.steps) {
    if (!step.at) continue;
    if (step.modifier === "depart" && hasTurn) continue;
    const meters = (step.along ?? 0) - traveled;
    if (meters < 18) continue;
    list.push({ instruction: step.instruction, street: step.street, modifier: step.modifier, meters });
  }
  list.sort((a, b) => a.meters - b.meters);
  return list.slice(0, count);
}

export function nextManeuver(route: WalkRoute, traveled: number) {
  return nextManeuvers(route, traveled, 1)[0] ?? null;
}

function placeSteps(steps: WalkStep[], line: [number, number][]) {
  return steps.slice(0, 48).map((step) => {
    if (!step.at || line.length < 2) return step;
    return { ...step, along: followRoute(step.at, line).traveledMeters };
  });
}
