"use client";

import { useEffect, useId, useRef, useState } from "react";

type OrientationReading = DeviceOrientationEvent & { webkitCompassHeading?: number };

function headingFromEvent(event: OrientationReading) {
  if (typeof event.webkitCompassHeading === "number" && Number.isFinite(event.webkitCompassHeading)) {
    return event.webkitCompassHeading;
  }
  if (typeof event.alpha !== "number" || !Number.isFinite(event.alpha)) return null;
  return (360 - event.alpha) % 360;
}

export function requestCompass() {
  const orientation = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
    requestPermission?: () => Promise<"granted" | "denied">;
  };
  if (typeof orientation.requestPermission !== "function") return Promise.resolve();
  return orientation.requestPermission().then(() => undefined).catch(() => undefined);
}

/** Só escuta orientação depois do soft prompt aceito (evita pop-up nativo no load). */
export function useDeviceHeading(enabled = true) {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setHeading(null);
      return;
    }
    let last = -1;
    let stamp = 0;
    const onOrient = (event: Event) => {
      const next = headingFromEvent(event as OrientationReading);
      if (next == null) return;
      if (last >= 0) {
        const delta = Math.abs((((next - last) % 360) + 540) % 360 - 180);
        if (delta < 12) return;
      }
      const now = Date.now();
      if (now - stamp < 350) return;
      stamp = now;
      last = next;
      setHeading(next);
    };
    window.addEventListener("deviceorientationabsolute", onOrient, true);
    window.addEventListener("deviceorientation", onOrient, true);
    return () => {
      window.removeEventListener("deviceorientationabsolute", onOrient, true);
      window.removeEventListener("deviceorientation", onOrient, true);
    };
  }, [enabled]);

  return heading;
}

function useShortestHeading(heading: number) {
  const value = useRef(heading);
  const [smooth, setSmooth] = useState(heading);

  useEffect(() => {
    const current = value.current;
    const normalized = ((current % 360) + 360) % 360;
    let delta = heading - normalized;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const next = current + delta;
    value.current = next;
    setSmooth(next);
  }, [heading]);

  return smooth;
}

export function HeadingBeam({ heading }: { heading: number }) {
  const raw = useId().replace(/:/g, "");
  const wash = `beam-wash-${raw}`;
  const core = `beam-core-${raw}`;
  const smooth = useShortestHeading(heading);

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[240px] w-[240px]" style={{ marginLeft: -120, marginTop: -120 }}>
      <div
        className="h-full w-full will-change-transform"
        style={{ transform: `rotate(${smooth}deg)`, transition: "transform 180ms linear" }}
      >
        <svg viewBox="0 0 220 220" className="heading-beam h-full w-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id={wash} x1="110" y1="110" x2="110" y2="12" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f7fffe" stopOpacity="0.35" />
              <stop offset="16%" stopColor="#b8fff6" stopOpacity="0.82" />
              <stop offset="42%" stopColor="#1ad4ff" stopOpacity="0.62" />
              <stop offset="74%" stopColor="#5b7cff" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#e4c8ff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={core} x1="110" y1="110" x2="110" y2="18" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
              <stop offset="28%" stopColor="#d9fff8" stopOpacity="0.72" />
              <stop offset="70%" stopColor="#7af6ff" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#7af6ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M110 110 51 30Q110 8 169 30Z" fill={`url(#${wash})`} opacity="0.85" />
          <path d="M110 110 78 20Q110 10 142 20Z" fill={`url(#${core})`} />
          <path d="M110 110 104 22h12Z" fill="#ffffff" opacity="0.55" />
        </svg>
      </div>
    </div>
  );
}
