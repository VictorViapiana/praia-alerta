"use client";

import { useEffect, useRef } from "react";

/**
 * Abertura surreal: o sol nasce debaixo d'água.
 * Zero imagens. Só transform/opacity no compositor — não disputa CPU com o mapa.
 */

const FILM_MS = 5400;
const WARM_MS = 3000;

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

      <div className="sx-fold sx-fold-sea sx-anim" aria-hidden />
      <div className="sx-fold sx-fold-sky sx-anim" aria-hidden />

      <span className="sx-orb sx-anim" aria-hidden />
      <span className="sx-ring sx-r1 sx-anim" aria-hidden />
      <span className="sx-ring sx-r2 sx-anim" aria-hidden />
      <span className="sx-ring sx-r3 sx-anim" aria-hidden />
      <span className="sx-spark sx-anim" aria-hidden />
      <span className="sx-blade sx-anim" aria-hidden />

      <p className="sx-title sx-anim">Guarapari</p>
      <p className="sx-sub sx-anim">onde o mar começa</p>
    </div>
  );
}
