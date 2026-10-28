"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * A Maré Recuando — splash épica nível Apple/Awwwards.
 * Só transform + opacity (GPU). O mapa aquece por baixo; a onda desce e o componente desmonta.
 */

const WARM_MS = 2500;
const DONE_MS = 4800;
const TIDE_EASE = [0.25, 1, 0.5, 1] as const;

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
        <div className="sx-ocean">
          <div className="sx-ocean-fill" />
          <div className="sx-brand-slot">
            <div className="sx-glass">
              <img src="/logo-splash.png" alt="" width={96} height={96} draggable={false} decoding="async" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sx-splash" role="img" aria-label="Abrindo Praia Alerta">
      <motion.div
        className="sx-ocean"
        initial={{ y: 0 }}
        animate={{ y: "108%" }}
        transition={{ delay: 2.65, duration: 1.85, ease: TIDE_EASE }}
      >
        <div className="sx-ocean-fill" />

        <svg className="sx-wave" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden>
          <path
            fill="url(#sxOcean)"
            d="M0 80 C180 20 360 140 540 80 C720 20 900 140 1080 80 C1260 20 1380 100 1440 70 L1440 160 L0 160 Z"
          />
          <defs>
            <linearGradient id="sxOcean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0c4a6e" />
              <stop offset="55%" stopColor="#155e75" />
              <stop offset="100%" stopColor="#164e63" />
            </linearGradient>
          </defs>
        </svg>

        <span className="sx-ripple-slot">
          <motion.span
            className="sx-ripple"
            initial={{ opacity: 0.55, scale: 0.15 }}
            animate={{ opacity: 0, scale: 2.8 }}
            transition={{ duration: 2.1, ease: TIDE_EASE }}
          />
        </span>
        <span className="sx-ripple-slot">
          <motion.span
            className="sx-ripple sx-ripple-b"
            initial={{ opacity: 0.4, scale: 0.12 }}
            animate={{ opacity: 0, scale: 3.3 }}
            transition={{ delay: 0.28, duration: 2.3, ease: TIDE_EASE }}
          />
        </span>
        <span className="sx-ripple-slot">
          <motion.span
            className="sx-ripple sx-ripple-c"
            initial={{ opacity: 0.28, scale: 0.1 }}
            animate={{ opacity: 0, scale: 3.8 }}
            transition={{ delay: 0.55, duration: 2.45, ease: TIDE_EASE }}
          />
        </span>

        <div className="sx-brand-slot">
          <motion.div
            className="sx-brand"
            initial={{ opacity: 0, scale: 0.78 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.78, 1, 1.04, 1.22] }}
            transition={{ duration: 2.55, times: [0, 0.18, 0.72, 1], ease: TIDE_EASE }}
          >
            <span className="sx-beacon" aria-hidden />
            <div className="sx-glass">
              <img
                src="/logo-splash.png"
                alt=""
                width={112}
                height={112}
                draggable={false}
                decoding="async"
                fetchPriority="high"
              />
            </div>
            <p className="sx-wordmark">Praia Alerta</p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
