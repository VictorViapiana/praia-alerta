"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Ascensão Cinematográfica — fundo do mar → superfície → Guará → sun flare.
 * Parallax 300vh só com translateY/scale/opacity. Desmonta ao fim.
 */

const WARM_MS = 2400;
const DONE_MS = 4500;
const RISE = [0.22, 1, 0.36, 1] as const;
const FLARE = [0.16, 1, 0.3, 1] as const;
const FLY = [0.33, 0.02, 0.2, 1] as const;

function Fish({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 16" aria-hidden>
      <path
        fill="currentColor"
        d="M2 8c6-6 14-7 22-4 3 1 6 2 9 2-2 2-5 3-8 4-7 2-14 2-21-2 1-1 1-1-2 0z"
      />
      <circle cx="28" cy="7" r="1.1" fill="#0c4a6e" />
    </svg>
  );
}

/** Guará em voo — corpo + asas independentes (batida CSS) + bico curvo característico. */
function GuaraBird() {
  return (
    <div className="sx-guara-rig" aria-hidden>
      {/* Asset WebP pronto: <img src="/pins/guara-fly.webp" alt="" className="sx-guara-photo" /> */}
      <svg className="sx-guara-svg" viewBox="0 0 200 110" fill="none">
        <defs>
          <linearGradient id="gBody" x1="40" y1="20" x2="140" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fb7185" />
            <stop offset="0.35" stopColor="#e11d48" />
            <stop offset="1" stopColor="#9f1239" />
          </linearGradient>
          <linearGradient id="gWing" x1="20" y1="10" x2="120" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fda4af" />
            <stop offset="0.45" stopColor="#e11d48" />
            <stop offset="0.82" stopColor="#be123c" />
            <stop offset="1" stopColor="#1c1917" />
          </linearGradient>
          <linearGradient id="gBeak" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#57534e" />
            <stop offset="1" stopColor="#1c1917" />
          </linearGradient>
        </defs>

        {/* Asa de trás (bate fora de fase) */}
        <g className="sx-wing sx-wing-back">
          <path
            fill="url(#gWing)"
            d="M78 52c18-28 48-40 78-38 4 2 6 6 4 10-14 8-30 18-42 32-8 10-14 18-22 22-6-8-12-16-18-26z"
          />
          <path
            fill="#0f172a"
            opacity="0.92"
            d="M138 22c8-2 16-2 22-1-2 5-6 9-12 14-4 3-8 5-12 6 0-7 1-13 2-19z"
          />
          <path
            stroke="#9f1239"
            strokeWidth="1.2"
            strokeOpacity="0.45"
            d="M86 50c14-18 34-28 56-30M92 56c12-12 28-20 46-22"
          />
        </g>

        {/* Pernas recolhidas no vento */}
        <g className="sx-legs">
          <path stroke="#7f1d1d" strokeWidth="2.2" strokeLinecap="round" d="M108 68c8 10 14 22 16 34" />
          <path stroke="#7f1d1d" strokeWidth="2" strokeLinecap="round" d="M102 70c6 12 10 24 10 34" />
        </g>

        {/* Corpo + pescoço alongado típico do ibis */}
        <g className="sx-body">
          <ellipse cx="96" cy="58" rx="28" ry="16" fill="url(#gBody)" transform="rotate(-12 96 58)" />
          <path
            fill="url(#gBody)"
            d="M74 54c-10-2-22-2-34 4-6 3-12 8-18 10 4-10 12-18 22-22 10-4 22-6 32-4 2 2 2 6-2 12z"
          />
          {/* Cabeça */}
          <ellipse cx="28" cy="48" rx="11" ry="9" fill="#e11d48" />
          <circle cx="24" cy="46" r="2.2" fill="#1c1917" />
          <circle cx="23.2" cy="45.2" r="0.7" fill="#fff" />
          {/* Bico longo e curvo — assinatura do Guará */}
          <path
            fill="url(#gBeak)"
            d="M18 50c-8 2-16 8-22 18-1 2 1 3 2 2 6-8 14-14 22-16 2-1 2-3-2-4z"
          />
          {/* Cauda com ponta preta */}
          <path fill="#be123c" d="M118 52c12 2 22 10 28 22-10-2-20-4-30-2-2-6-2-14 2-20z" />
          <path fill="#0f172a" d="M138 68c4 4 6 8 6 12-6-2-12-4-18-4 4-4 8-6 12-8z" />
        </g>

        {/* Asa da frente — batida principal */}
        <g className="sx-wing sx-wing-front">
          <path
            fill="url(#gWing)"
            d="M82 56c22-32 58-46 92-40 5 3 6 8 3 12-18 10-38 22-52 40-8 10-16 18-26 22-6-10-12-20-17-34z"
          />
          <path
            fill="#0f172a"
            d="M152 26c10-2 20-1 28 2-3 6-9 12-18 18-6 4-12 6-18 7 2-10 4-18 8-27z"
          />
          <path
            stroke="#fecdd3"
            strokeWidth="1.1"
            strokeOpacity="0.35"
            d="M90 54c18-22 44-34 72-36M96 62c16-16 38-26 62-28M102 70c14-12 32-20 52-22"
          />
        </g>
      </svg>
      <span className="sx-guara-wake" />
    </div>
  );
}

export function SplashScreen({ onWarm, onDone }: { onWarm?: () => void; onDone: () => void }) {
  const doneRef = useRef(false);
  const warmRef = useRef(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const freeze = params.get("splash");
    if (freeze !== null && freeze !== "" && !Number.isNaN(Number(freeze))) {
      return undefined;
    }

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
      timers.push(window.setTimeout(finish, DONE_MS));
    }

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [onDone, onWarm, reduce]);

  if (reduce) {
    return (
      <div className="sx-splash" role="img" aria-label="Abrindo Praia Alerta">
        <div className="sx-sky-static" />
      </div>
    );
  }

  return (
    <div className="sx-splash" role="img" aria-label="Abrindo Praia Alerta">
      <motion.div
        className="sx-rise"
        initial={{ y: "-66.666%" }}
        animate={{ y: ["-66.666%", "-66.666%", "0%", "0%"] }}
        transition={{ duration: 4.5, times: [0, 0.33, 0.56, 1], ease: [RISE, RISE, RISE] }}
      >
        {/* TOPO: céu + sol */}
        <section className="sx-band sx-sky">
          <span className="sx-haze" aria-hidden />
          <motion.span
            className="sx-sun"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: [1, 1, 1, 48], opacity: [1, 1, 1, 1] }}
            transition={{ duration: 4.5, times: [0, 0.72, 0.78, 1], ease: [RISE, RISE, FLARE] }}
            aria-hidden
          />

          {/* Guará: cruza R→L com arco, banking e batida de asas */}
          <motion.div
            className="sx-guara"
            initial={{ x: "125vw", y: "8vh", rotate: -14, scale: 0.72, opacity: 0 }}
            animate={{
              x: ["125vw", "55vw", "-10vw", "-70vw", "-130vw"],
              y: ["8vh", "-2vh", "6vh", "-4vh", "10vh"],
              rotate: [-14, -6, 4, -8, -18],
              scale: [0.72, 0.95, 1.08, 0.98, 0.78],
              opacity: [0, 1, 1, 1, 0],
            }}
            transition={{
              delay: 2.45,
              duration: 1.12,
              ease: FLY,
              times: [0, 0.22, 0.48, 0.74, 1],
              opacity: { duration: 1.12, times: [0, 0.08, 0.7, 0.88, 1], ease: "linear" },
            }}
            aria-hidden
          >
            <GuaraBird />
          </motion.div>
        </section>

        {/* MEIO: coluna d'água + superfície */}
        <section className="sx-band sx-mid">
          <span className="sx-surface" aria-hidden />
          <span className="sx-caustic" aria-hidden />
          <span className="sx-bubble sx-b1" aria-hidden />
          <span className="sx-bubble sx-b2" aria-hidden />
          <span className="sx-bubble sx-b3" aria-hidden />
        </section>

        {/* FUNDO: rochas, algas, peixes */}
        <section className="sx-band sx-deep">
          <span className="sx-sand" aria-hidden />
          {/* Placeholders WebP: background-image: url('/pins/rock-a.webp') */}
          <span className="sx-rock sx-rock-a" aria-hidden />
          <span className="sx-rock sx-rock-b" aria-hidden />
          <span className="sx-rock sx-rock-c" aria-hidden />

          <span className="sx-kelp sx-k1" aria-hidden />
          <span className="sx-kelp sx-k2" aria-hidden />
          <span className="sx-kelp sx-k3" aria-hidden />
          <span className="sx-kelp sx-k4" aria-hidden />

          <div className="sx-school sx-school-a" aria-hidden>
            <Fish className="sx-fish" />
            <Fish className="sx-fish" />
            <Fish className="sx-fish" />
            <Fish className="sx-fish" />
          </div>
          <div className="sx-school sx-school-b" aria-hidden>
            <Fish className="sx-fish" />
            <Fish className="sx-fish" />
            <Fish className="sx-fish" />
          </div>

          <span className="sx-bubble sx-b4" aria-hidden />
          <span className="sx-bubble sx-b5" aria-hidden />
          <span className="sx-bubble sx-b6" aria-hidden />
        </section>
      </motion.div>

      <motion.div
        className="sx-flare"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0, 1, 0] }}
        transition={{ duration: 4.5, times: [0, 0.76, 0.82, 0.9, 1], ease: "linear" }}
        aria-hidden
      />
    </div>
  );
}
