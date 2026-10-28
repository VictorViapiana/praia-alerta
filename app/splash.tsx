"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Maré Noturna Viapiana — preto absoluto + vermelho profundo + farol.
 * Só transform / opacity / clip-path. Sem WebGL. Desmonta ao fim.
 */

const WARM_MS = 1600;
const DONE_MS = 3500;
const TIDE = [0.22, 1, 0.36, 1] as const;
const DIVE = [0.87, 0, 0.13, 1] as const;

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
        <div className="sx-night" />
        <div className="sx-brand-slot">
          <div className="sx-glass">
            <img src="/logo-splash.png" alt="" width={96} height={96} draggable={false} decoding="async" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sx-splash" role="img" aria-label="Abrindo Praia Alerta">
      <div className="sx-night" />

      {/* Oceano negro: sobe, recua; --sx-hole 0%→150% rasga do centro; clip-path fecha no fim */}
      <motion.div
        className="sx-ocean"
        initial={{ y: "102%", clipPath: "circle(150% at 50% 50%)", ["--sx-hole" as string]: "0%" }}
        animate={{
          y: ["102%", "0%", "0%", "6%", "6%"],
          clipPath: [
            "circle(150% at 50% 50%)",
            "circle(150% at 50% 50%)",
            "circle(150% at 50% 50%)",
            "circle(150% at 50% 50%)",
            "circle(0% at 50% 50%)",
          ],
          ["--sx-hole" as string]: ["0%", "0%", "0%", "0%", "150%"],
        }}
        transition={{
          duration: 3.2,
          times: [0, 0.28, 0.72, 0.78, 1],
          ease: [TIDE, TIDE, TIDE, DIVE],
        }}
      >
        <div className="sx-ocean-body" />

        <svg className="sx-crest" viewBox="0 0 1440 180" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="sxCrest" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7f1d1d" stopOpacity="0" />
              <stop offset="35%" stopColor="#dc2626" stopOpacity="0.85" />
              <stop offset="55%" stopColor="#67e8f9" stopOpacity="0.55" />
              <stop offset="75%" stopColor="#991b1b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="sxGlassSea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#140808" />
              <stop offset="45%" stopColor="#0a0505" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
          </defs>
          <path
            fill="url(#sxGlassSea)"
            d="M0 90 C160 20 320 160 480 90 C640 20 800 160 960 90 C1120 20 1280 150 1440 80 L1440 180 L0 180 Z"
          />
          <path
            fill="none"
            stroke="url(#sxCrest)"
            strokeWidth="2.2"
            d="M0 90 C160 20 320 160 480 90 C640 20 800 160 960 90 C1120 20 1280 150 1440 80"
          />
        </svg>

        <div className="sx-brand-slot">
          <motion.div
            className="sx-brand"
            initial={{ opacity: 0, scale: 0.82, y: 28 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.82, 1, 1.02, 1.12], y: [28, 0, 0, -8] }}
            transition={{ duration: 2.45, delay: 0.55, times: [0, 0.22, 0.78, 1], ease: TIDE }}
          >
            <div className="sx-glass">
              <span className="sx-sweep" aria-hidden />
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

        {/* Pingo / onda de choque — escala no compositor */}
        <span className="sx-ping-slot">
          <motion.span
            className="sx-ping"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0, 0.95, 0], scale: [0, 0, 0.2, 3.4] }}
            transition={{ duration: 3.2, times: [0, 0.76, 0.8, 1], ease: DIVE }}
          />
        </span>
        <span className="sx-ping-slot">
          <motion.span
            className="sx-ping sx-ping-b"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0, 0.7, 0], scale: [0, 0, 0.15, 4.2] }}
            transition={{ duration: 3.2, times: [0, 0.78, 0.82, 1], ease: DIVE }}
          />
        </span>
      </motion.div>
    </div>
  );
}
