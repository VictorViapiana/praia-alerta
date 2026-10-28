"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Ascensão Cinematográfica — parallax 300vh + Guará hiper-realista.
 * Só transform/opacity. Guará vive numa camada fixa (fora do overflow).
 * Desmonta ao fim.
 */

const TOTAL_S = 8.6;
const WARM_MS = 4200;
const DONE_MS = 8600;
const RISE = [0.33, 0.08, 0.25, 1] as const;
const FLARE = [0.16, 1, 0.3, 1] as const;
const FLY = [0.37, 0.08, 0.18, 1] as const;

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

function Wing({ className, gradId }: { className?: string; gradId: string }) {
  return (
    <svg className={className} viewBox="0 0 160 90" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="45%" stopColor="#e11d48" />
          <stop offset="78%" stopColor="#9f1239" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradId})`}
        d="M12 70C28 28 70 6 118 8c12 1 22 6 28 14-22 8-48 22-68 44-10 12-20 20-34 24-8-6-16-12-32-20z"
      />
      <path
        fill="#0f172a"
        d="M118 14c14 2 24 8 30 16-10 6-22 12-36 16 2-12 4-22 6-32z"
      />
      <path
        stroke="#fecdd3"
        strokeOpacity="0.35"
        strokeWidth="1.2"
        fill="none"
        d="M28 62c22-24 52-38 86-40M36 70c20-18 48-30 78-32"
      />
    </svg>
  );
}

/** Guará real (PNG cutout) + asas articuladas batendo. */
function GuaraBird() {
  return (
    <div className="sx-guara-rig" aria-hidden>
      <Wing className="sx-wing sx-wing-back" gradId="sxWingBack" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="sx-guara-photo"
        src="/pins/guara-fly.webp"
        alt=""
        width={640}
        height={614}
        decoding="async"
        draggable={false}
      />
      <Wing className="sx-wing sx-wing-front" gradId="sxWingFront" />
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
      for (const src of ["/pins/guara-fly.webp", "/guara-inteiro.png?v=1", "/guara.png?v=3"]) {
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
        transition={{
          duration: TOTAL_S,
          times: [0, 0.26, 0.48, 1],
          ease: [RISE, RISE, RISE],
        }}
      >
        <section className="sx-band sx-sky">
          <span className="sx-haze" aria-hidden />
          <motion.span
            className="sx-sun"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1, 1, 1.15, 55] }}
            transition={{
              duration: TOTAL_S,
              times: [0, 0.72, 0.82, 0.86, 1],
              ease: [RISE, RISE, RISE, FLARE],
            }}
            aria-hidden
          />
        </section>

        <section className="sx-band sx-mid">
          <span className="sx-surface" aria-hidden />
          <span className="sx-caustic" aria-hidden />
          <span className="sx-bubble sx-b1" aria-hidden />
          <span className="sx-bubble sx-b2" aria-hidden />
          <span className="sx-bubble sx-b3" aria-hidden />
        </section>

        <section className="sx-band sx-deep">
          <span className="sx-sand" aria-hidden />
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

      {/* Camada FIXA do Guará — fora do parallax/overflow, impossível de clipar */}
      <motion.div
        className="sx-guara-layer"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1, 1, 0] }}
        transition={{
          duration: TOTAL_S,
          times: [0, 0.475, 0.5, 0.82, 0.88],
          ease: "linear",
        }}
        aria-hidden
      >
        <motion.div
          className="sx-guara"
          initial={{ x: "110vw", y: "6vh", rotate: -18, scale: 0.78 }}
          animate={{
            x: ["110vw", "62vw", "18vw", "-28vw", "-70vw", "-120vw"],
            y: ["6vh", "-4vh", "5vh", "-6vh", "3vh", "12vh"],
            rotate: [-18, -8, 2, -6, -12, -22],
            scale: [0.78, 0.95, 1.12, 1.18, 1.02, 0.85],
          }}
          transition={{
            delay: 4.15,
            duration: 3.15,
            ease: FLY,
            times: [0, 0.18, 0.38, 0.58, 0.78, 1],
          }}
        >
          <GuaraBird />
        </motion.div>
      </motion.div>

      <motion.div
        className="sx-flare"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.35, 1, 0] }}
        transition={{
          duration: TOTAL_S,
          times: [0, 0.84, 0.88, 0.93, 1],
          ease: "linear",
        }}
        aria-hidden
      />
    </div>
  );
}
