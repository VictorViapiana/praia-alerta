"use client";

import { useEffect, useRef } from "react";

/**
 * Portal da Maré: a gota que contém o oceano inteiro.
 * Zero imagens / zero canvas. Só transform + opacity no compositor.
 */

const FILM_MS = 6400;
const WARM_MS = 3400;

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
      timers.push(window.setTimeout(finish, 420));
    } else {
      timers.push(window.setTimeout(warm, WARM_MS));
      timers.push(window.setTimeout(finish, FILM_MS));
    }

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [onDone, onWarm]);

  return (
    <div className="sx-splash is-on" role="img" aria-label="Abrindo Praia Alerta">
      <div className="sx-void sx-anim" />

      {/* Mundo invertido atrás do portal */}
      <div className="sx-world sx-anim" aria-hidden>
        <div className="sx-world-sky" />
        <div className="sx-world-sea" />
      </div>

      {/* Câmara com perspectiva: a gota engole a tela */}
      <div className="sx-stage" aria-hidden>
        <div className="sx-drop sx-anim">
          <span className="sx-drop-core" />
          <span className="sx-drop-sun" />
          <span className="sx-drop-shine" />
        </div>

        <span className="sx-gyro sx-gyro-a sx-anim" />
        <span className="sx-gyro sx-gyro-b sx-anim" />
        <span className="sx-gyro sx-gyro-c sx-anim" />

        {/* Horizonte circular que vira uma linha — topologia impossível */}
        <span className="sx-halo sx-anim" />
      </div>

      <span className="sx-flash sx-anim" aria-hidden />

      <p className="sx-mirror sx-anim" aria-hidden>
        Guarapari
      </p>
      <p className="sx-title sx-anim">Guarapari</p>
      <p className="sx-sub sx-anim">o mar cabe numa gota</p>
    </div>
  );
}
