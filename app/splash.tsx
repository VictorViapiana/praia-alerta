"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Splash simples e linda — horizonte, Guará e marca.
 * Só transform/opacity. Desmonta ao fim.
 */

const WARM_MS = 1400;
const DONE_MS = 3200;
const EASE = [0.22, 1, 0.36, 1] as const;

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
      for (const src of ["/pins/guara-mascot.webp", "/guara.png?v=3"]) {
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
      timers.push(window.setTimeout(finish, 380));
    } else {
      timers.push(window.setTimeout(warm, WARM_MS));
      timers.push(window.setTimeout(finish, DONE_MS));
    }

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [onDone, onWarm, reduce]);

  if (reduce) {
    return (
      <div className="sx-splash" role="img" aria-label="Abrindo Praia Alerta">
        <div className="sx-wash" />
      </div>
    );
  }

  return (
    <motion.div
      className="sx-splash"
      role="img"
      aria-label="Abrindo Praia Alerta"
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 0] }}
      transition={{ duration: 3.2, times: [0, 0.78, 1], ease: "linear" }}
    >
      <div className="sx-wash" aria-hidden />
      <div className="sx-sun-wrap" aria-hidden>
        <span className="sx-sun-halo" />
        <span className="sx-sun-corona" />
        <span className="sx-sun" />
      </div>
      <span className="sx-sea" aria-hidden />

      <div className="sx-stage">
        <motion.div
          className="sx-bird"
          initial={{ opacity: 0, y: 36, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.05, delay: 0.12, ease: EASE }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="sx-bird-img"
            src="/pins/guara-mascot.webp"
            alt=""
            width={480}
            height={640}
            decoding="async"
            draggable={false}
          />
        </motion.div>

        <motion.div
          className="sx-brand"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55, ease: EASE }}
        >
          <p className="sx-name">Praia Alerta</p>
          <p className="sx-tag">Praia do Morro</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
