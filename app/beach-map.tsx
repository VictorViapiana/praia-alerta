"use client";

import "./leaflet-rotate-setup";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapContainer, Marker, Polygon, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { DivIcon, LatLngExpression } from "leaflet";
import L from "leaflet";
import { Anchor, Hotel, IceCreamCone, Martini, Pill, ShoppingBag, ShowerHead, Star, Trees, Utensils, type LucideIcon } from "lucide-react";
import { fold } from "./coast";
import { MarkerPopup } from "./marker-popup";
import { RouteChoice } from "./route-choice";
import {
  AMBULANTES,
  CARRINHO_SRC,
  ESCUNA_POINT,
  ESCUNA_SRC,
  ESCUNA_WAKE_SRC,
  MARLIN,
  MARLIN_SRC,
  ORLA_LANDMARKS,
  PLACES,
  SHOWERS,
  type Ambulante,
  type OrlaLandmark,
  type Place,
} from "./places";
import type { PinKind } from "./page-types";
import { HeadingBeam } from "./heading-beam";
import { RAMPA_CORRIDOR, RAMPA_EDGE_LEFT, RAMPA_EDGE_RIGHT, RAMPA_NOTE, RAMPA_PRINCIPAL } from "./rampas";
import { metersBetween } from "./walk-route";

declare module "leaflet" {
  interface MapOptions {
    rotate?: boolean;
    bearing?: number;
    rotateControl?: boolean;
    touchRotate?: boolean;
    shiftKeyRotate?: boolean;
    compassBearing?: boolean;
  }
  interface Map {
    setBearing(theta: number, options?: { animate?: boolean; duration?: number }): void;
    getBearing(): number;
  }
}

export const ORLA_CENTER: LatLngExpression = [-20.6544, -40.4875];
export const ORLA_ZOOM = 16;

export type BasemapStyle = "satellite" | "clean";
const PLACE_ZOOM = 17;

function escunaIcon(zoom: number) {
  const intro = zoom < 18;
  const width = intro ? 140 : 226;
  const height = intro ? 98 : 158;
  return L.divIcon({
    className: "orla-pin",
    iconSize: [width, height],
    iconAnchor: [Math.round(width / 2), height - 4],
    html: `<span class="escuna-label">Escunas</span><span class="escuna-boat" style="width:${width}px;height:${height}px"><img src="${ESCUNA_WAKE_SRC}" alt="" class="escuna-wake" draggable="false" style="width:${Math.round(width * 250 / 226)}px" /><img src="${ESCUNA_SRC}" alt="" class="escuna-pin" width="${width}" height="${height}" draggable="false" style="width:${width}px;height:${height}px" /></span>`,
  });
}

function cartIcon(heading: number) {
  const east = Math.sin((heading * Math.PI) / 180);
  const flip = east >= 0 ? -1 : 1;
  return L.divIcon({
    className: "orla-pin",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    html: `<img src="${CARRINHO_SRC}" alt="" class="carrinho-pin" width="32" height="32" draggable="false" style="width:32px;height:32px;transform:scaleX(${flip});transform-origin:center center" />`,
  });
}

const PIN_COLOR: Record<PinKind, { solid: string; glow: string }> = {
  quiosques: { solid: "#e39b12", glow: "0 8px 18px rgba(227,155,18,0.55)" },
  duchas: { solid: "#0284c7", glow: "0 8px 18px rgba(2,132,199,0.5)" },
  hoteis: { solid: "#6d5ef5", glow: "0 8px 18px rgba(109,94,245,0.5)" },
  sorveterias: { solid: "#db2777", glow: "0 8px 18px rgba(219,39,119,0.5)" },
  parceiros: { solid: "#059669", glow: "0 8px 18px rgba(5,150,105,0.5)" },
  ambulantes: { solid: "#7c3aed", glow: "0 8px 18px rgba(124,58,237,0.55)" },
};

const PLACE_ICON: Record<PinKind, LucideIcon> = {
  quiosques: Martini,
  duchas: ShowerHead,
  hoteis: Hotel,
  sorveterias: IceCreamCone,
  parceiros: Utensils,
  ambulantes: ShoppingBag,
};

function placeIcon(place: Place) {
  if (place.id === "farmacia") return Pill;
  return PLACE_ICON[place.mapKind];
}

function markerSize(place: Place) {
  if (place.mapKind === "quiosques") return 40;
  return place.isSponsor ? 32 : 24;
}

type MapFilter = "neutro" | PinKind;

type FlyTarget = { id: number; lat: number; lng: number } | null;

function pinIcon(host: HTMLElement, size: number, anchor: "tip" | "center") {
  return L.divIcon({
    className: "orla-pin",
    html: host,
    iconSize: [size, size],
    iconAnchor: anchor === "tip" ? [size / 2, size] : [size / 2, size / 2],
  });
}

function ReactPin({
  position,
  zIndexOffset,
  size,
  anchor = "tip",
  interactive = true,
  children,
}: {
  position: [number, number];
  zIndexOffset: number;
  size: number;
  anchor?: "tip" | "center";
  interactive?: boolean;
  children: React.ReactNode;
}) {
  const [host] = useState(() => {
    const node = document.createElement("div");
    if (!interactive) node.style.pointerEvents = "none";
    return node;
  });
  const icon = useMemo(() => pinIcon(host, size, anchor), [host, size, anchor]);

  return (
    <>
      <Marker position={position} icon={icon as DivIcon} zIndexOffset={zIndexOffset} keyboard={false} />
      {createPortal(children, host)}
    </>
  );
}

function MapReady({ onClear, onHold }: { onClear: () => void; onHold: (lat: number, lng: number) => void }) {
  const map = useMap();
  const timer = useRef(0);
  const held = useRef(false);
  const point = useRef<{ x: number; y: number; lat: number; lng: number } | null>(null);

  const cancel = () => window.clearTimeout(timer.current);

  useMapEvents({
    mousedown(event) {
      cancel();
      held.current = false;
      point.current = { x: event.containerPoint.x, y: event.containerPoint.y, lat: event.latlng.lat, lng: event.latlng.lng };
      timer.current = window.setTimeout(() => {
        const spot = point.current;
        if (!spot) return;
        held.current = true;
        onHold(spot.lat, spot.lng);
      }, 560);
    },
    mousemove(event) {
      const spot = point.current;
      if (!spot) return;
      if (Math.hypot(event.containerPoint.x - spot.x, event.containerPoint.y - spot.y) > 12) cancel();
    },
    mouseup: cancel,
    dragstart: cancel,
    contextmenu(event) {
      event.originalEvent.preventDefault();
      cancel();
      held.current = true;
      onHold(event.latlng.lat, event.latlng.lng);
    },
    click() {
      if (held.current) {
        held.current = false;
        return;
      }
      onClear();
    },
  });
  useEffect(() => {
    const node = map.getContainer();
    let scheduled = 0;
    const paint = () => {
      if (scheduled) return;
      scheduled = window.requestAnimationFrame(() => {
        scheduled = 0;
        map.invalidateSize({ animate: false });
      });
    };
    const observer = new ResizeObserver(paint);
    observer.observe(node);
    const timerId = window.setTimeout(paint, 120);
    return () => {
      observer.disconnect();
      window.clearTimeout(timerId);
      window.clearTimeout(timer.current);
      if (scheduled) cancelAnimationFrame(scheduled);
    };
  }, [map]);
  return null;
}

function geoBearing(from: [number, number], to: [number, number]) {
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const dLng = ((to[1] - from[1]) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

function pointAlong(line: [number, number][], meters: number): [number, number] {
  let walked = 0;
  for (let index = 1; index < line.length; index += 1) {
    const previous = line[index - 1];
    const next = line[index];
    const step = metersBetween({ lat: previous[0], lng: previous[1] }, { lat: next[0], lng: next[1] });
    if (walked + step >= meters) {
      const ratio = step === 0 ? 0 : (meters - walked) / step;
      return [previous[0] + (next[0] - previous[0]) * ratio, previous[1] + (next[1] - previous[1]) * ratio];
    }
    walked += step;
  }
  return line[line.length - 1];
}

function bearingAhead(line: [number, number][]) {
  return (geoBearing(line[0], pointAlong(line, 40)) + 360) % 360;
}

const CAR_ICON = L.divIcon({
  className: "orla-pin",
  iconSize: [54, 84],
  iconAnchor: [27, 42],
  html: `<div style="width:54px;height:84px;filter:drop-shadow(0 8px 6px rgba(15,23,42,.5))"><svg viewBox="0 0 54 84" width="54" height="84"><ellipse cx="27" cy="46" rx="16" ry="24" fill="rgba(15,23,42,.22)"/><path d="M18 30c0-14 3.4-22 9-22s9 8 9 22l3.4 32c.6 5-2.6 10-7.4 10h-10c-4.8 0-8-5-7.4-10L18 30Z" fill="#f8fafc" stroke="#0f172a" stroke-width="2.2"/><path d="M20.5 32c.8-8 3-13 6.5-13s5.7 5 6.5 13v8h-13v-8Z" fill="#38bdf8" stroke="#0284c7" stroke-width="1"/><path d="M20 44h14v16c0 2-1.4 3-3 3H23c-1.6 0-3-1-3-3V44Z" fill="#e2e8f0"/><path d="M21 62h12l-.6 6.2c-.2 1.6-1.4 2.6-2.8 2.6h-5.2c-1.4 0-2.6-1-2.8-2.6L21 62Z" fill="#0284c7"/><rect x="12" y="34" width="5" height="5" rx="1.4" fill="#0f172a"/><rect x="37" y="34" width="5" height="5" rx="1.4" fill="#0f172a"/><rect x="15.5" y="28" width="3.2" height="9" rx="1.2" fill="#111827"/><rect x="35.3" y="28" width="3.2" height="9" rx="1.2" fill="#111827"/><rect x="15.5" y="52" width="3.2" height="9" rx="1.2" fill="#111827"/><rect x="35.3" y="52" width="3.2" height="9" rx="1.2" fill="#111827"/></svg></div>`,
});

function chevronIcon(degrees: number) {
  return L.divIcon({
    className: "orla-pin",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<span style="display:grid;place-items:center;width:26px;height:26px;transform:rotate(${degrees}deg);filter:drop-shadow(0 1px 1px rgba(15,23,42,.65))"><svg viewBox="0 0 26 26" width="26" height="26"><path d="M13 3.2 23.2 21.4H16.6L13 14.2 9.4 21.4H2.8Z" fill="#ffffff" stroke="#075985" stroke-width="1.6" stroke-linejoin="round"/></svg></span>`,
  });
}

function angleDelta(from: number, to: number) {
  return ((to - from + 540) % 360) - 180;
}

function routeSamples(line: [number, number][]) {
  const samples: { at: [number, number]; dist: number; bearing: number }[] = [];
  let walked = 0;
  for (let index = 1; index < line.length && walked < 6000; index += 1) {
    const previous = line[index - 1];
    const next = line[index];
    const step = metersBetween({ lat: previous[0], lng: previous[1] }, { lat: next[0], lng: next[1] });
    if (step < 0.4) continue;
    const bearing = (geoBearing(previous, next) + 360) % 360;
    const pieces = Math.max(1, Math.round(step / 8));
    for (let piece = 1; piece <= pieces; piece += 1) {
      const ratio = piece / pieces;
      samples.push({
        at: [previous[0] + (next[0] - previous[0]) * ratio, previous[1] + (next[1] - previous[1]) * ratio],
        dist: walked + step * ratio,
        bearing,
      });
    }
    walked += step;
  }
  return samples;
}

function nearestSample(samples: { at: [number, number]; dist: number; bearing: number }[], dist: number) {
  return samples.reduce((best, sample) => (Math.abs(sample.dist - dist) < Math.abs(best.dist - dist) ? sample : best));
}

function curveBend(samples: { at: [number, number]; dist: number; bearing: number }[], dist: number) {
  return Math.abs(angleDelta(nearestSample(samples, dist - 24).bearing, nearestSample(samples, dist + 24).bearing));
}

function curveChevrons(line: [number, number][], up: number) {
  const samples = routeSamples(line);
  if (samples.length < 3) return [];
  const apexes: number[] = [];
  let last = -200;
  for (const sample of samples) {
    if (sample.dist < 36 || sample.dist < last + 70) continue;
    const bend = curveBend(samples, sample.dist);
    if (bend < 42) continue;
    const before = curveBend(samples, sample.dist - 12);
    const after = curveBend(samples, sample.dist + 12);
    if (bend + 2 < before || bend + 2 < after) continue;
    apexes.push(sample.dist);
    last = sample.dist;
  }
  return apexes.flatMap((apex) =>
    [-16, 0, 16].map((shift) => {
      const spot = nearestSample(samples, apex + shift);
      return { at: spot.at, rot: (spot.bearing - up + 360) % 360 };
    }),
  );
}

function FollowNav({ active, line, tick }: { active: boolean; line: [number, number][] | null; tick: number }) {
  const map = useMap();
  const lineRef = useRef(line);
  lineRef.current = line;
  useEffect(() => {
    const path = lineRef.current;
    if (!active || !path || path.length < 2) {
      if (map.getBearing?.()) map.setBearing(0);
      return;
    }
    const heading = bearingAhead(path);
    const bearing = (360 - heading) % 360;
    map.setBearing(bearing);
    const origin = path[0];
    const rad = (heading * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const latScale = 111320;
    const lngScale = 111320 * Math.cos((origin[0] * Math.PI) / 180);
    let minX = 0;
    let maxX = 0;
    let minY = 0;
    let maxY = 0;
    for (const point of path) {
      const north = (point[0] - origin[0]) * latScale;
      const east = (point[1] - origin[1]) * lngScale;
      const forward = north * cos + east * sin;
      const right = east * cos - north * sin;
      minX = Math.min(minX, right);
      maxX = Math.max(maxX, right);
      minY = Math.min(minY, forward);
      maxY = Math.max(maxY, forward);
    }
    const size = map.getSize();
    const mpp = Math.max((maxX - minX) / Math.max(120, size.x - 64), (maxY - minY) / Math.max(140, size.y - 270), 0.8);
    const zoom = Math.max(15.75, Math.min(17.75, Math.log2((156543.03392 * Math.cos((origin[0] * Math.PI) / 180)) / mpp)));
    const midRight = (minX + maxX) / 2;
    const midForward = (minY + maxY) / 2;
    const north = midForward * cos - midRight * sin;
    const east = midForward * sin + midRight * cos;
    map.setView([origin[0] + north / latScale, origin[1] + east / lngScale], zoom, { animate: false });
  }, [active, tick, map]);
  return null;
}

function FitRoute({ line, active }: { line: [number, number][] | null; active: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!active || !line || line.length < 2) return;
    map.fitBounds(L.latLngBounds(line), {
      paddingTopLeft: [24, 148],
      paddingBottomRight: [24, 168],
      maxZoom: 17,
      animate: true,
    });
  }, [line, map, active]);
  return null;
}

const FLAG_ICON = L.divIcon({
  className: "orla-pin",
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  html: `<span style="display:grid;place-items:center;width:22px;height:22px;border-radius:999px 999px 999px 2px;background:#e11d48;border:2px solid white;box-shadow:0 8px 16px rgba(0,0,0,.4);transform:rotate(-45deg)"></span>`,
});

const START_ICON = L.divIcon({
  className: "orla-pin",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  html: `<span style="display:block;width:16px;height:16px;border-radius:999px;background:#082E84;border:2px solid white;box-shadow:0 6px 12px rgba(0,0,0,.4)"></span>`,
});

const STOP_ICON = L.divIcon({
  className: "orla-pin",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  html: `<span style="display:block;width:14px;height:14px;border-radius:999px;background:#f59e0b;border:2px solid white;box-shadow:0 4px 10px rgba(0,0,0,.35)"></span>`,
});

function FlyTo({ target }: { target: FlyTarget }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    let shifted = false;
    const shift = () => {
      if (shifted) return;
      shifted = true;
      map.panBy([0, -155], { animate: true, duration: 0.35 });
    };
    map.flyTo([target.lat, target.lng], 18, { duration: 0.85 });
    map.once("moveend", shift);
    return () => {
      map.off("moveend", shift);
    };
  }, [map, target]);
  return null;
}

function ShowerPin({
  name,
  faded,
}: {
  name: string;
  faded: boolean;
}) {
  return (
    <div className="relative h-6 w-6" style={{ opacity: faded ? 0.28 : 1 }}>
      <span className="absolute bottom-full left-1/2 mb-1 block w-max max-w-[10.5rem] -translate-x-1/2 truncate rounded-full border border-white bg-white px-2 py-1 text-center text-[12px] font-bold leading-none tracking-normal text-[#3c2a18] shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
        {name}
      </span>
      <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-white text-[#0284c7] shadow-[0_0_0_1px_rgba(0,0,0,0.45),0_6px_12px_rgba(0,0,0,0.55)]">
        <ShowerHead className="h-3 w-3" strokeWidth={2.2} />
      </span>
    </div>
  );
}

function KioskMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7" aria-hidden>
      <ellipse cx="24" cy="43.2" rx="13" ry="1.8" fill="#9a3412" opacity="0.22" />
      <path d="M3 24.5c7-2.2 13-12 21-15.2 8 3.2 14 13 21 15.2-1.6 2.4-9 3.6-21 3.6S4.6 26.9 3 24.5Z" fill="#ea580c" />
      <path d="M8 23.2c5.2-1.6 10.4-8.2 16-10.6 5.6 2.4 10.8 9 16 10.6" fill="none" stroke="#fdba74" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7.5 25.2c4.6 1.4 10.2 2.2 16.5 2.2s11.9-.8 16.5-2.2" fill="none" stroke="#9a3412" strokeWidth="1.15" opacity="0.55" />
      <path d="M9.5 27.2 12 31l2.5-3.8 2.5 3.8 2.5-3.8 2.5 3.8 2.5-3.8 2.5 3.8 2.5-3.8 2.5 3.8L34 27.2" fill="none" stroke="#c2410c" strokeWidth="1.35" strokeLinejoin="round" strokeLinecap="round" />
      <rect x="14.2" y="28.4" width="3" height="11.2" rx="1" fill="#9a3412" />
      <rect x="30.8" y="28.4" width="3" height="11.2" rx="1" fill="#7c2d12" />
      <path d="M11.5 33.2h25v3.3c0 .9-.7 1.6-1.6 1.6H13.1c-.9 0-1.6-.7-1.6-1.6v-3.3Z" fill="#fb923c" />
      <path d="M11.5 33.2h25v1.35h-25Z" fill="#fff7ed" />
      <rect x="10.2" y="39.4" width="27.6" height="2.5" rx="1" fill="#9a3412" />
    </svg>
  );
}

function CommercePin({
  place,
  faded,
  highlighted,
  selected,
  onSelect,
  onOpen,
}: {
  place: Place;
  faded: boolean;
  highlighted: boolean;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const color = PIN_COLOR[place.mapKind];
  const Icon = placeIcon(place);
  const kiosk = place.mapKind === "quiosques";
  const kioskNumber = kiosk ? String(Number(place.name.match(/\d+/)?.[0] ?? "0")) : "";
  const mark = place.name.split("·")[0].trim();
  const premium = place.isSponsor;
  const box = kiosk ? "h-10 w-10" : premium ? "h-8 w-8" : "h-6 w-6";

  return (
    <div className={`relative ${box}`} style={{ opacity: faded ? 0.28 : 1 }}>
      {selected && <MarkerPopup place={place} onOpen={onOpen} />}
      {!selected && !kiosk && (
        <span
          className={`absolute bottom-full left-1/2 mb-1 block w-max max-w-[10.5rem] -translate-x-1/2 truncate rounded-full border px-2 py-1 text-center text-[12px] font-bold leading-none tracking-normal shadow-[0_2px_8px_rgba(0,0,0,0.55)] ${premium ? "border-amber-100 bg-[#1c1208] text-amber-50" : "border-white bg-white text-[#3c2a18]"}`}
        >
          {mark}
        </span>
      )}
      <button
        type="button"
        aria-label={place.name}
        aria-pressed={selected}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        className={`relative grid ${box} place-items-center`}
      >
        {!kiosk && (highlighted || (premium && !faded)) && (
          <span
            className={`pin-pulse absolute rounded-full ${premium ? "h-8 w-8" : "h-6 w-6"}`}
            style={{ background: premium ? "#f59e0b" : color.solid, animationDuration: premium ? "1.8s" : "1.45s" }}
          />
        )}
        {kiosk ? (
          <span className="relative grid h-10 w-10 place-items-center">
            <span className={`grid h-10 w-10 place-items-center rounded-full border-2 bg-white text-[#c2410c] shadow-[0_0_0_1px_rgba(0,0,0,0.4),0_6px_12px_rgba(0,0,0,0.45)] ${premium ? "border-amber-200" : "border-white"}`}>
              <KioskMark />
            </span>
            {premium ? (
              <span className="pointer-events-none absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 translate-y-full items-center gap-0.5 rounded-full border border-[#f6e6c4] bg-[#7c2d12] px-1.5 py-0.5 text-[12px] font-bold leading-none text-[#f8e6c4] shadow-[0_2px_4px_rgba(0,0,0,0.45)]">
                <Star aria-hidden className="h-2 w-2 fill-[#f8e6c4] text-[#f8e6c4]" strokeWidth={2} />
                {kioskNumber}
              </span>
            ) : (
              <span className="pointer-events-none absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-full rounded-full border border-white/80 bg-white px-1.5 py-0.5 text-[12px] font-bold leading-none tabular-nums text-[#3f2a1a] shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
                {kioskNumber}
              </span>
            )}
          </span>
        ) : (
          <>
            <span
              className={`grid ${box} place-items-center rounded-full border-2 ${premium ? "border-amber-100" : "border-white"}`}
              style={{
                background: premium ? "linear-gradient(160deg,#fff7e6,#f59e0b)" : highlighted ? color.solid : "white",
                color: premium ? "#7c2d12" : highlighted ? "white" : color.solid,
                boxShadow: premium
                  ? "0 0 0 1px rgba(0,0,0,0.45), 0 6px 12px rgba(0,0,0,0.55)"
                  : highlighted
                    ? `0 0 0 2px white, ${color.glow}`
                    : "0 0 0 1px rgba(0,0,0,0.45), 0 6px 12px rgba(0,0,0,0.55)",
              }}
            >
              <Icon className={premium ? "h-3.5 w-3.5" : "h-3 w-3"} strokeWidth={2.2} />
            </span>
            {premium && (
              <span className="absolute -right-1 -top-1 grid h-3 w-3 place-items-center rounded-full bg-[#1c1208] text-amber-200">
                <Star className="h-2 w-2 fill-amber-300 text-amber-300" />
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
}

const SHORE_HEADING = (Math.atan2(0.67, 0.74) * 180) / Math.PI;

function vendorHeading(walks: boolean, step: number) {
  if (!walks) return SHORE_HEADING;
  const forward = step >= 1 && step <= 4;
  return forward ? SHORE_HEADING : SHORE_HEADING - 180;
}

function VendorPin({
  vendor,
  heading,
  faded,
  selected,
}: {
  vendor: Ambulante;
  heading: number;
  faded: boolean;
  selected: boolean;
}) {
  return (
    <div className="pointer-events-none relative h-8 w-8" style={{ opacity: faded ? 0.28 : 1 }}>
      <HeadingBeam heading={heading} />
      {selected && (
        <div className="pointer-events-auto absolute bottom-[calc(100%+8px)] left-1/2 z-30 w-[188px] -translate-x-1/2">
          <div className="rounded-2xl border border-orange-100 bg-white px-2.5 py-2 text-left shadow-[0_12px_24px_rgba(180,70,0,0.22)]">
            <p className="text-[11px] font-bold text-orange-700">Credenciado</p>
            <p className="text-[12px] font-semibold leading-tight text-neutral-900">{vendor.name}</p>
            <p className="mt-0.5 text-[11px] text-neutral-500">{vendor.tag}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Na areia agora
            </p>
            <RouteChoice place={{ id: vendor.id, lat: vendor.lat, lng: vendor.lng, name: vendor.name }} tone="light" />
          </div>
          <span className="mx-auto -mt-1 block h-2.5 w-2.5 rotate-45 border-b border-r border-orange-100 bg-white" />
        </div>
      )}
      {!selected && (
        <span className="absolute bottom-full left-1/2 z-20 mb-1 block w-max max-w-[11rem] -translate-x-1/2 whitespace-nowrap rounded-full border border-white bg-white px-1.5 py-0.5 text-center text-[11px] font-bold leading-none tracking-normal text-[#7c2d12] shadow-[0_3px_10px_rgba(0,0,0,0.55)]">
          {vendor.name}
        </span>
      )}
    </div>
  );
}

function MarlinPin({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  return (
    <div className="relative h-12 w-12">
      {selected && (
        <div className="absolute bottom-[calc(100%+4px)] left-1/2 z-30 w-[188px] -translate-x-1/2">
          <div className="rounded-2xl border border-sky-100 bg-white px-2.5 py-2 text-left shadow-[0_12px_24px_rgba(15,23,42,0.2)]">
            <p className="text-[12px] font-semibold leading-tight text-[#082E84]">{MARLIN.name}</p>
            <p className="mt-0.5 text-[11px] text-neutral-500">{MARLIN.detail}</p>
            <RouteChoice place={{ id: MARLIN.id, lat: MARLIN.lat, lng: MARLIN.lng, name: MARLIN.name }} tone="light" />
          </div>
          <span className="mx-auto -mt-1 block h-2.5 w-2.5 rotate-45 border-b border-r border-sky-100 bg-white" />
        </div>
      )}
      <button
        type="button"
        aria-label={MARLIN.name}
        aria-pressed={selected}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        className={`grid h-12 w-12 place-items-center rounded-full border-2 border-[#1d4ed8] bg-white shadow-[0_6px_14px_rgba(15,23,42,0.3)] ${selected ? "ring-2 ring-sky-200" : ""}`}
      >
        <img
          src={MARLIN_SRC}
          alt=""
          draggable={false}
          width={32}
          height={32}
          style={{ width: 32, height: 32 }}
          className="object-contain"
        />
      </button>
      <span
        className="pointer-events-none absolute top-full left-1/2 mt-0.5 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold leading-none text-[#12315c]"
        style={{ textShadow: "0 0 3px #fff, 0 0 6px #fff, 1px 0 0 #fff, -1px 0 0 #fff, 0 1px 0 #fff, 0 -1px 0 #fff" }}
      >
        Marlin
      </span>
    </div>
  );
}

const LANDMARK_STYLE = {
  pier: {
    border: "border-[#0e7490]",
    ring: "ring-cyan-200",
    bubble: "border-cyan-100",
    title: "text-[#0e4a5c]",
    label: "text-[#0e4a5c]",
    iconBg: "from-cyan-400 to-teal-700",
    Icon: Anchor,
  },
  park: {
    border: "border-[#047857]",
    ring: "ring-emerald-200",
    bubble: "border-emerald-100",
    title: "text-[#065f46]",
    label: "text-[#065f46]",
    iconBg: "from-emerald-400 to-green-800",
    Icon: Trees,
  },
} as const;

function LandmarkPin({
  landmark,
  selected,
  onSelect,
}: {
  landmark: OrlaLandmark;
  selected: boolean;
  onSelect: () => void;
}) {
  const style = LANDMARK_STYLE[landmark.tone];
  const Icon = style.Icon;
  return (
    <div className="relative h-12 w-12">
      {selected && (
        <div className="absolute bottom-[calc(100%+4px)] left-1/2 z-30 w-[200px] -translate-x-1/2">
          <div className={`rounded-2xl border bg-white px-2.5 py-2 text-left shadow-[0_12px_24px_rgba(15,23,42,0.22)] ${style.bubble}`}>
            <p className={`text-[12px] font-semibold leading-tight ${style.title}`}>{landmark.name}</p>
            <p className="mt-0.5 text-[11px] text-neutral-500">{landmark.detail}</p>
            <RouteChoice
              place={{ id: landmark.id, lat: landmark.lat, lng: landmark.lng, name: landmark.name }}
              tone="light"
            />
          </div>
          <span className={`mx-auto -mt-1 block h-2.5 w-2.5 rotate-45 border-b border-r bg-white ${style.bubble}`} />
        </div>
      )}
      <button
        type="button"
        aria-label={landmark.name}
        aria-pressed={selected}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        className={`grid h-12 w-12 place-items-center rounded-full border-2 bg-white shadow-[0_6px_14px_rgba(15,23,42,0.3)] ${style.border} ${selected ? `ring-2 ${style.ring}` : ""}`}
      >
        <span className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-b text-white shadow-inner ${style.iconBg}`}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.3} />
        </span>
      </button>
      <span
        className={`pointer-events-none absolute top-full left-1/2 mt-0.5 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold leading-none ${style.label}`}
        style={{ textShadow: "0 0 3px #fff, 0 0 6px #fff, 1px 0 0 #fff, -1px 0 0 #fff, 0 1px 0 #fff, 0 -1px 0 #fff" }}
      >
        {landmark.short}
      </span>
    </div>
  );
}

function UserDot({ heading, driving }: { heading: number; driving?: boolean }) {
  if (driving) {
    return (
      <div className="relative grid h-11 w-11 place-items-center" aria-label="Você está aqui" style={{ transform: `rotate(${heading}deg)` }}>
        <span className="absolute h-14 w-14 rounded-full bg-[#1d4ed8]/25" />
        <svg viewBox="0 0 48 48" className="relative h-11 w-11 drop-shadow-[0_6px_10px_rgba(15,23,42,0.45)]">
          <path d="M24 6 40 40 24 32 8 40Z" fill="#1d4ed8" stroke="white" strokeWidth="3" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  return (
    <div className="user-loc" aria-label="Você está aqui">
      <HeadingBeam heading={heading} />
      <span className="user-loc-ring" />
      <span className="user-loc-dot" />
      <span className="user-loc-label">Você</span>
    </div>
  );
}

function RampaPin({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  return (
    <div className="relative h-7 w-7">
      {selected && (
        <div className="absolute bottom-[calc(100%+4px)] left-1/2 z-30 w-[220px] -translate-x-1/2">
          <div className="rounded-2xl border border-sky-100 bg-white px-2.5 py-2 text-left shadow-[0_12px_24px_rgba(15,23,42,0.2)]">
            <p className="text-[12px] font-semibold leading-tight text-[#0c4a6e]">{RAMPA_PRINCIPAL.name}</p>
            <p className="mt-0.5 text-[11px] text-neutral-500">{RAMPA_PRINCIPAL.detail}</p>
            <p className="mt-1 text-[12px] leading-snug text-neutral-700">{RAMPA_NOTE}</p>
            <RouteChoice place={{ id: RAMPA_PRINCIPAL.id, lat: RAMPA_PRINCIPAL.lat, lng: RAMPA_PRINCIPAL.lng, name: RAMPA_PRINCIPAL.name }} tone="light" />
          </div>
          <span className="mx-auto -mt-1 block h-2.5 w-2.5 rotate-45 border-b border-r border-sky-100 bg-white" />
        </div>
      )}
      <button
        type="button"
        aria-label={RAMPA_PRINCIPAL.name}
        aria-pressed={selected}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        className={`grid h-7 w-7 place-items-center overflow-hidden rounded-full border border-white bg-white shadow-[0_4px_8px_rgba(0,0,0,0.4)] ${selected ? "ring-2 ring-sky-200" : ""}`}
      >
        <svg viewBox="0 0 32 32" className="h-[22px] w-[22px]" aria-hidden>
          <ellipse cx="16" cy="25.2" rx="11" ry="3" fill="#e4c07a" />
          <path d="M6.5 22.2 20.5 12.2h5.2v3.2L11.2 25.2Z" fill="#d08a45" stroke="#8a4e1d" strokeWidth="0.8" strokeLinejoin="round" />
          <path d="M11.4 20.6 22.2 13.4M14.2 22.2 24.6 14.6" fill="none" stroke="#8a4e1d" strokeWidth="0.7" strokeLinecap="round" />
          <path d="M8.2 17.6 20.2 9.4" fill="none" stroke="#0b3a5b" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8.2 17.6v4.6M20.2 9.4v2.8" fill="none" stroke="#0b3a5b" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M11.2 19.8 22.4 11.8" fill="none" stroke="#0284c7" strokeWidth="1.15" strokeLinecap="round" />
        </svg>
      </button>
      <span className="pointer-events-none absolute top-full left-1/2 mt-0.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0b3a5b] px-1 py-px text-[9px] font-bold leading-none text-white shadow-[0_2px_6px_rgba(0,0,0,0.45)]">
        Rampa
      </span>
    </div>
  );
}

function OrlaMarkers({
  filter,
  query,
  openId,
  onSelect,
  onOpen,
  onOpenEscunas,
  onOpenVendor,
  onRampTap,
  user,
  heading,
  driving = false,
}: {
  filter: MapFilter;
  query: string;
  openId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onOpenEscunas: () => void;
  onOpenVendor: (id: string) => void;
  onRampTap: () => void;
  user: { lat: number; lng: number } | null;
  heading: number;
  driving?: boolean;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({
    zoomend() {
      const next = map.getZoom();
      setZoom((current) => {
        if ((current >= PLACE_ZOOM) === (next >= PLACE_ZOOM) && Math.floor(current) === Math.floor(next)) return current;
        return next;
      });
    },
  });
  const showPlaces = zoom >= PLACE_ZOOM;
  const showRamp = zoom >= 16;
  const escunaPin = useMemo(() => escunaIcon(zoom), [zoom]);
  const vendorMode = filter === "ambulantes";
  const cartIcons = useMemo(
    () => ({
      ahead: cartIcon(SHORE_HEADING),
      back: cartIcon(SHORE_HEADING - 180),
    }),
    [],
  );
  const [walk, setWalk] = useState<Record<string, { lat: number; lng: number; step: number }>>(() =>
    Object.fromEntries(AMBULANTES.map((vendor) => [vendor.id, { lat: vendor.lat, lng: vendor.lng, step: vendor.id === "picole" ? 4 : 0 }])),
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setWalk((current) => {
        const next = { ...current };
        for (const vendor of AMBULANTES) {
          if (!vendor.walks) continue;
          const step = (next[vendor.id].step + 1) % 8;
          const phase = step <= 4 ? step : 8 - step;
          const along = phase * 0.000045;
          next[vendor.id] = {
            lat: vendor.lat + along * 0.74,
            lng: vendor.lng + along * 0.67,
            step,
          };
        }
        return next;
      });
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      {showPlaces &&
        !vendorMode &&
        SHOWERS.map((shower) => {
          const nameHit = !query || fold(shower.name).includes(query);
          const inCategory = filter === "neutro" || filter === shower.mapKind;
          return (
            <ReactPin key={shower.id} position={[shower.lat, shower.lng]} zIndexOffset={12} size={24}>
              <ShowerPin name={shower.name} faded={!nameHit || !inCategory} />
            </ReactPin>
          );
        })}
      {showPlaces &&
        !vendorMode &&
        PLACES.map((place) => {
          const nameHit = !query || fold(place.name).includes(query);
          const inCategory = filter === "neutro" || filter === place.mapKind;
          const highlighted = nameHit && inCategory && (query.length > 0 || filter !== "neutro");
          const selected = openId === place.id;
          return (
            <ReactPin
              key={place.id}
              position={[place.lat, place.lng]}
              zIndexOffset={selected ? 900 : highlighted ? 200 : 20}
              size={markerSize(place)}
            >
              <CommercePin
                place={place}
                faded={!nameHit || !inCategory}
                highlighted={highlighted}
                selected={selected}
                onSelect={() => onSelect(place.id)}
                onOpen={() => onOpen(place.id)}
              />
            </ReactPin>
          );
        })}
      {showPlaces &&
        (filter === "neutro" || filter === "ambulantes") &&
        AMBULANTES.filter((vendor) => vendor.isSponsor && vendor.isOnline).map((vendor) => {
          const point = walk[vendor.id] ?? { lat: vendor.lat, lng: vendor.lng, step: 0 };
          const nameHit = !query || fold(`${vendor.name} ${vendor.tag}`).includes(query);
          const selected = openId === vendor.id;
          return (
            <Fragment key={vendor.id}>
              <ReactPin position={[point.lat, point.lng]} zIndexOffset={selected ? 930 : 230} size={32} anchor="tip" interactive={false}>
                <VendorPin
                  vendor={vendor}
                  heading={vendorHeading(vendor.walks, point.step)}
                  faded={!nameHit}
                  selected={selected}
                />
              </ReactPin>
              <Marker
                position={[point.lat, point.lng]}
                icon={vendorHeading(vendor.walks, point.step) === SHORE_HEADING ? cartIcons.ahead : cartIcons.back}
                zIndexOffset={selected ? 950 : 250}
                opacity={nameHit ? 1 : 0.28}
          eventHandlers={{
            click: (event) => {
              event.originalEvent.stopPropagation();
              onOpenVendor(vendor.id);
            },
          }}
              />
            </Fragment>
          );
        })}
      {showPlaces && (
        <Marker
          position={[ESCUNA_POINT.lat, ESCUNA_POINT.lng]}
          icon={escunaPin}
          zIndexOffset={880}
          eventHandlers={{
            click: (event) => {
              event.originalEvent.stopPropagation();
              onOpenEscunas();
            },
          }}
        />
      )}
      {showPlaces && (
        <ReactPin position={[MARLIN.lat, MARLIN.lng]} zIndexOffset={openId === MARLIN.id ? 960 : 260} size={48} anchor="center">
          <MarlinPin selected={openId === MARLIN.id} onSelect={() => onSelect(MARLIN.id)} />
        </ReactPin>
      )}
      {showPlaces &&
        ORLA_LANDMARKS.map((landmark) => (
          <ReactPin
            key={landmark.id}
            position={[landmark.lat, landmark.lng]}
            zIndexOffset={openId === landmark.id ? 965 : 255}
            size={48}
            anchor="center"
          >
            <LandmarkPin
              landmark={landmark}
              selected={openId === landmark.id}
              onSelect={() => onSelect(landmark.id)}
            />
          </ReactPin>
        ))}
      {showRamp && (
        <>
          <Polygon
            positions={RAMPA_CORRIDOR}
            pathOptions={{ stroke: false, fillColor: "#ffffff", fillOpacity: 0, className: "rampa-hit" }}
            eventHandlers={{
              click: (event) => {
                event.originalEvent.stopPropagation();
                onRampTap();
              },
            }}
          />
          <Polyline
            positions={RAMPA_EDGE_LEFT}
            pathOptions={{ color: "#16120e", weight: 3, opacity: 0.55, lineCap: "round" }}
            interactive={false}
          />
          <Polyline
            positions={RAMPA_EDGE_RIGHT}
            pathOptions={{ color: "#16120e", weight: 3, opacity: 0.55, lineCap: "round" }}
            interactive={false}
          />
          <ReactPin position={[RAMPA_PRINCIPAL.lat, RAMPA_PRINCIPAL.lng]} zIndexOffset={openId === RAMPA_PRINCIPAL.id ? 970 : 280} size={28} anchor="center">
            <RampaPin selected={openId === RAMPA_PRINCIPAL.id} onSelect={() => onSelect(RAMPA_PRINCIPAL.id)} />
          </ReactPin>
        </>
      )}
      {user && (
        <ReactPin position={[user.lat, user.lng]} zIndexOffset={1000} size={driving ? 44 : 36} anchor="center">
          <UserDot heading={heading} driving={driving} />
        </ReactPin>
      )}
    </>
  );
}

export function BeachMap({
  filter,
  query,
  openId,
  onSelect,
  onOpen,
  onOpenEscunas,
  onOpenVendor,
  onRampTap,
  onClear,
  onHold,
  flyTo,
  user,
  heading,
  basemap,
  routeLine,
  routeColor,
  destination,
  stops,
  originMark,
  driving = false,
  follow = false,
  followTick = 0,
  traveledLine = null,
  remainingLine = null,
}: {
  filter: MapFilter;
  query: string;
  openId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onOpenEscunas: () => void;
  onOpenVendor: (id: string) => void;
  onRampTap: () => void;
  onClear: () => void;
  onHold: (lat: number, lng: number) => void;
  flyTo: FlyTarget;
  user: { lat: number; lng: number } | null;
  heading: number;
  basemap: BasemapStyle;
  routeLine: [number, number][] | null;
  routeColor: string;
  destination: { lat: number; lng: number } | null;
  stops: { lat: number; lng: number; name: string }[];
  originMark: { lat: number; lng: number } | null;
  driving?: boolean;
  follow?: boolean;
  followTick?: number;
  traveledLine?: [number, number][] | null;
  remainingLine?: [number, number][] | null;
}) {
  const clean = basemap === "clean";
  const guideLine = remainingLine && remainingLine.length > 1 ? remainingLine : routeLine;
  const track = driving && follow && Boolean(guideLine && guideLine.length > 1);
  const camera = track && guideLine ? bearingAhead(guideLine) : 0;
  const arrows = useMemo(() => (track && guideLine ? curveChevrons(guideLine, camera) : []), [track, guideLine, camera]);
  return (
    <MapContainer
      key={driving ? "drive" : "browse"}
      center={ORLA_CENTER}
      zoom={ORLA_ZOOM}
      zoomSnap={0.5}
      zoomDelta={0.5}
      maxZoom={19}
      zoomControl={false}
      rotate={driving}
      bearing={0}
      rotateControl={false}
      touchRotate={false}
      shiftKeyRotate={false}
      compassBearing={false}
      preferCanvas
      fadeAnimation={false}
      markerZoomAnimation={false}
      inertiaDeceleration={2800}
      wheelPxPerZoomLevel={100}
      className="orla-map absolute inset-0 z-0 h-full w-full"
      style={{ background: driving ? "#eceff1" : clean ? "#f3f6f4" : "#2c3832", zIndex: 0 }}
    >
      {driving ? (
        <>
          <TileLayer
            key="nav-base"
            className="orla-drive"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
            maxNativeZoom={16}
            updateWhenZooming={false}
            updateWhenIdle={false}
            keepBuffer={4}
          />
          <TileLayer
            key="nav-labels"
            className="orla-drive"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
            maxNativeZoom={16}
            updateWhenZooming={false}
            updateWhenIdle={false}
            keepBuffer={3}
          />
        </>
      ) : clean ? (
        <TileLayer
          key="clean"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
          maxNativeZoom={18}
          updateWhenZooming={false}
          updateWhenIdle={false}
          keepBuffer={6}
        />
      ) : (
        <>
          {/* Base baixa: se a tile fina atrasa, a orla ainda aparece em vez de faixa preta. */}
          <TileLayer
            key="satellite-under"
            className="orla-satellite"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
            maxNativeZoom={15}
            updateWhenZooming={false}
            updateWhenIdle={false}
            keepBuffer={8}
            zIndex={1}
          />
          <TileLayer
            key="satellite"
            className="orla-satellite"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
            maxNativeZoom={18}
            updateWhenZooming={false}
            updateWhenIdle={false}
            keepBuffer={6}
            zIndex={2}
          />
        </>
      )}
      {!driving && !clean && (
        <TileLayer
          key="satellite-roads"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
          maxNativeZoom={17}
          opacity={0.85}
          updateWhenZooming={false}
          updateWhenIdle={false}
          keepBuffer={4}
          zIndex={3}
        />
      )}
      <MapReady onClear={onClear} onHold={onHold} />
      {!driving && <FlyTo target={flyTo} />}
      <FollowNav active={track} line={guideLine} tick={followTick} />
      <FitRoute line={routeLine} active={!track} />
      {driving && traveledLine && traveledLine.length > 1 && (
        <Polyline positions={traveledLine} pathOptions={{ color: "#94a3b8", weight: 10, opacity: 0.55 }} />
      )}
      {guideLine && guideLine.length > 1 && (
        <>
          <Polyline positions={guideLine} pathOptions={{ color: driving ? "#0f172a" : "#ffffff", weight: driving ? 18 : 8, opacity: driving ? 0.95 : 0.95 }} />
          <Polyline positions={guideLine} pathOptions={{ color: driving ? "#0091ff" : routeColor, weight: driving ? 12 : 4, opacity: 1 }} />
        </>
      )}
      {arrows.map((arrow, index) => (
        <Marker key={`${arrow.at[0].toFixed(5)}-${index}`} position={arrow.at} icon={chevronIcon(arrow.rot)} interactive={false} keyboard={false} zIndexOffset={650} />
      ))}
      {!driving && originMark && <Marker position={[originMark.lat, originMark.lng]} icon={START_ICON} zIndexOffset={700} keyboard={false} />}
      {stops.map((stop) => (
        <Marker key={`${stop.lat}-${stop.lng}`} position={[stop.lat, stop.lng]} icon={STOP_ICON} zIndexOffset={710} keyboard={false} />
      ))}
      {destination && <Marker position={[destination.lat, destination.lng]} icon={FLAG_ICON} zIndexOffset={720} keyboard={false} />}
      {driving && guideLine && guideLine.length > 0 && (
        <Marker position={guideLine[0]} icon={CAR_ICON} zIndexOffset={1100} interactive={false} keyboard={false} />
      )}
      {!driving && (
        <OrlaMarkers
          filter={filter}
          query={query}
          openId={openId}
          onSelect={onSelect}
          onOpen={onOpen}
          onOpenEscunas={onOpenEscunas}
          onOpenVendor={onOpenVendor}
          onRampTap={onRampTap}
          user={user}
          heading={heading}
          driving={driving}
        />
      )}
    </MapContainer>
  );
}
