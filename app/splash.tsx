"use client";

import { useEffect, useRef } from "react";

/**
 * Abertura fotoreal: placa real da orla + horizonte que se abre.
 * Só transform/opacity no compositor — sem setState no meio da cena.
 */

const FILM_MS = 6800;
const WARM_MS = 4300;
/** Altura do horizonte na splash-plate.webp (em vh, bate com a foto). */
const HORIZON = "45.68vh";

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
    <div
      className="sx-splash is-on"
      role="img"
      aria-label="Abrindo Praia Alerta"
      style={{ ["--horizon" as string]: HORIZON }}
    >
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
