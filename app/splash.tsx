"use client";

import { useEffect, useRef } from "react";

/**
 * Abertura: o pôr do sol está pintado numa placa só.
 * O emblema sobe pelo reflexo, senta no sol, e o horizonte se abre.
 * Nada de setState no meio — só transform/opacity no compositor.
 */

const FILM_MS = 6400;
const WARM_MS = 4100;

export function SplashScreen({ onWarm, onDone }: { onWarm?: () => void; onDone: () => void }) {
  const doneRef = useRef(false);
  const warmRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const freeze = params.get("splash");
    const root = document.querySelector<HTMLElement>(".sx-splash");
    if (freeze !== null && freeze !== "" && !Number.isNaN(Number(freeze)) && root) {
      root.style.setProperty("--freeze", `-${Number(freeze)}s`);
      root.classList.add("is-freeze");
      return undefined;
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: number[] = [];

    const warm = () => {
      if (warmRef.current) return;
      warmRef.current = true;
      for (const src of ["/guara-inteiro.png?v=1", "/guara.png?v=3"]) {
        const img = new Image();
        img.decoding = "async";
        img.src = src;
        void img.decode?.().catch(() => undefined);
      }
      onWarm?.();
    };

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDone();
    };

    if (reduce) {
      timers.push(window.setTimeout(warm, 40));
      timers.push(window.setTimeout(finish, 520));
    } else {
      timers.push(window.setTimeout(warm, WARM_MS));
      timers.push(window.setTimeout(finish, FILM_MS));
    }

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [onDone, onWarm]);

  return (
    <div className="sx-splash is-on" role="img" aria-label="Abrindo Praia Alerta">
      <div className="sx-night sx-anim" />

      <div className="sx-half sx-sky sx-anim">
        <img
          className="sx-plate sx-plate-sky"
          src="/splash-plate.webp"
          alt=""
          draggable={false}
          decoding="sync"
          fetchPriority="high"
        />
        <svg className="sx-flock sx-anim" viewBox="0 0 168 46" aria-hidden>
          <g fill="none" stroke="#c01840" strokeWidth="1.8" strokeLinecap="round">
            <path d="M8 28c6-9 12-9 18 0" />
            <path d="M36 32c5-7 10-7 15 0" />
            <path d="M64 20c6-9 12-9 18 0" />
            <path d="M96 30c5-7 10-7 15 0" />
            <path d="M126 18c5-8 10-8 15 0" />
          </g>
        </svg>
      </div>

      <div className="sx-half sx-sea sx-anim">
        <img
          className="sx-plate sx-plate-sea"
          src="/splash-plate.webp"
          alt=""
          draggable={false}
          decoding="sync"
          fetchPriority="high"
        />
        <img className="sx-reflect sx-anim" src="/logo-splash.png" alt="" draggable={false} decoding="async" />
      </div>

      <span className="sx-ring sx-anim" aria-hidden />
      <span className="sx-ring sx-ring-b sx-anim" aria-hidden />

      <img
        className="sx-logo sx-anim"
        src="/logo-splash.png"
        alt=""
        draggable={false}
        decoding="async"
        fetchPriority="high"
      />

      <p className="sx-caption sx-anim">GUARAPARI · ES</p>
    </div>
  );
}
