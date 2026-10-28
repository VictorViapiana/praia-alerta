"use client";

import { useEffect, useRef } from "react";

/**
 * Nascer do Fundo — o sol nasce debaixo do mar e empurra o horizonte.
 * História clara, look cinematográfico. Zero imagens. Só transform/opacity.
 */

const FILM_MS = 6800;
const WARM_MS = 3600;

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
      timers.push(window.setTimeout(finish, 480));
    } else {
      timers.push(window.setTimeout(warm, WARM_MS));
      timers.push(window.setTimeout(finish, FILM_MS));
    }

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [onDone, onWarm]);

  return (
    <div className="sx-splash is-on" role="img" aria-label="Abrindo Praia Alerta">
      <div className="sx-void sx-anim" />

      <div className="sx-sky sx-anim" aria-hidden />
      <div className="sx-sea sx-anim" aria-hidden>
        <span className="sx-glow sx-anim" />
      </div>

      {/* Sol sobe de DENTRO da água — o impossível */}
      <span className="sx-sun sx-anim" aria-hidden />

      {/* Menisco: a superfície curva quando o sol atravessa */}
      <span className="sx-meniscus sx-anim" aria-hidden />
      <span className="sx-horizon sx-anim" aria-hidden />

      {/* Caminho de luz na água (reflexo vertical) */}
      <span className="sx-path sx-anim" aria-hidden />

      <div className="sx-copy">
        <p className="sx-title sx-anim">Guarapari</p>
        <p className="sx-sub sx-anim">o sol nasce do mar</p>
      </div>

      <span className="sx-veil sx-anim" aria-hidden />
    </div>
  );
}
