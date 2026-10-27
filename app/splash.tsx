"use client";

import { useEffect, useRef } from "react";

/**
 * Entrada do Praia Alerta — uma única timeline CSS (transform/opacity).
 * Sem setState no meio da cena, para não travar o frame.
 *
 * 0s oceano · logo sobe com a linha d'água · golden hour · anéis e brilho
 * 4.3s a cena inteira sobe numa espuma e revela a home
 */

const FILM_MS = 5600;
const WARM_MS = 4200;

export function SplashScreen({ onWarm, onDone }: { onWarm?: () => void; onDone: () => void }) {
  const doneRef = useRef(false);
  const warmRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const freeze = params.get("splash");
    const root = document.querySelector<HTMLElement>(".pa-splash");
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
    <div className="pa-splash is-on" role="presentation" aria-label="Abrindo Praia Alerta">
      <div className="pa-lift pa-anim">
      <div className="pa-scene">
        <div className="pa-sky pa-anim" />
        <div className="pa-sun-glow pa-anim" />
        <div className="pa-sun pa-anim" />
        <svg className="pa-ridges pa-anim" viewBox="0 0 1440 280" preserveAspectRatio="none" aria-hidden>
          <path
            fill="#6a4586"
            d="M0 280V168C160 150 250 46 430 92c150 38 230-62 400-8 150 48 250-28 420 36 70 26 140 18 190 28v132Z"
          />
          <path
            fill="#24183a"
            d="M0 280V198c210-10 300-78 470-28 160 48 250-36 430 18 170 52 280-8 400 28 50 14 100 10 140 16v48Z"
          />
        </svg>
        <svg className="pa-birds pa-anim" viewBox="0 0 140 40" aria-hidden>
          <g fill="none" stroke="#9a2240" strokeWidth="1.7" strokeLinecap="round">
            <path d="M4 22c5-8 10-8 15 0" />
            <path d="M30 26c4-6 8-6 12 0" />
            <path d="M54 16c5-8 10-8 15 0" />
            <path d="M82 24c4-6 8-6 12 0" />
            <path d="M108 14c4.5-7 9-7 13.5 0" />
          </g>
        </svg>

        <div className="pa-water pa-anim">
          <div className="pa-rays" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="pa-bubbles" aria-hidden>
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <svg className="pa-shore" viewBox="0 0 2880 90" preserveAspectRatio="none" aria-hidden>
            <path
              fill="rgba(255,248,230,0.92)"
              d="M0 46c80 18 140-22 220-4s150 26 230 4 140-24 220-2 150 24 230 2 140-22 220-2 150 26 230 4 140-24 220-2 150 22 230 2 140-20 220 0 150 24 230 4 140-22 220-2 150 20 210 2V90H0Z"
            />
            <path
              fill="#0c6e8c"
              d="M0 58c80 16 140-16 220 0s150 20 230 2 140-18 220 0 150 18 230 0 140-16 220 2 150 18 230 2 140-16 220 0 150 16 230 0 140-14 220 2 150 16 210 2V90H0Z"
            />
          </svg>
        </div>

        <div className="pa-logo-wrap pa-anim">
          <span className="pa-halo" aria-hidden />
          <span className="pa-ring pa-anim" aria-hidden />
          <span className="pa-ring b pa-anim" aria-hidden />
          <img src="/logo-splash.png" alt="" draggable={false} decoding="async" fetchPriority="high" />
          <span className="pa-sweep" aria-hidden />
        </div>

        <p className="pa-caption pa-anim">GUARAPARI · ES</p>

      </div>
      <svg className="pa-foam" viewBox="0 0 1440 96" preserveAspectRatio="none" aria-hidden>
        <path fill="rgba(255,255,255,0.95)" d="M0 40c120-24 200 28 320 8 130-22 210 30 340 8 120-20 220 28 340 6 130-24 230 26 340 8 60-8 90-4 100 0v26H0Z" />
        <path fill="#02121b" d="M0 62c120-16 210 22 330 6 130-18 220 22 340 4 130-18 230 20 350 4 120-16 230 18 320 6 40-4 70 0 100 2v20H0Z" />
      </svg>
      </div>
    </div>
  );
}
