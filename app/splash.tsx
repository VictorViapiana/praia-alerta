"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Splash simples e linda — horizonte, Guará e marca.
 * Só transform/opacity. Desmonta ao fim.
 *
 * Árvore DOM idêntica no SSR e no cliente — preferência de reduced-motion
 * só altera os timers (lida no effect), nunca o markup.
 */

const WARM_MS = 1400;
const DONE_MS = 3200;
const EASE = [0.22, 1, 0.36, 1] as const;

export function SplashScreen({ onWarm, onDone }: { onWarm?: () => void; onDone: () => void }) {
  const doneRef = useRef(false);
  const warmRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const freeze = params.get("splash");
    if (freeze !== null && freeze !== "" && !Number.isNaN(Number(freeze))) {
      return undefined;
    }

    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const timers: number[] = [];

    const warm = () => {
      if (warmRef.current) return;
      warmRef.current = true;
      for (const src of ["/guara/chapeu-alegretto.webp?v=3", "/pins/guara-mascot.webp", "/guara.png?v=3"]) {
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

    timers.push(window.setTimeout(warm, reduce ? 40 : WARM_MS));
    timers.push(window.setTimeout(finish, reduce ? 380 : DONE_MS));

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [onDone, onWarm]);

  return (
    <motion.div
      className="sx-splash"
      role="img"
      aria-label="Abrindo Praia Alerta Guará"
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
            src="/guara/chapeu-alegretto.webp?v=3"
            alt=""
            width={621}
            height={975}
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
          <p className="sx-name">Praia Alerta Guará</p>
          <p className="sx-tag">Praia do Morro</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
