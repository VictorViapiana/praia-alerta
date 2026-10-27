"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Splash "Praia Alerta" — cena em camadas CSS/GPU (sem canvas).
 *
 * Só anima transform/opacity via @property → lisinha em qualquer aparelho.
 *
 *  0.0s  oceano profundo, logo submerso, raios e bolhas
 *  0.5s  logo sobe; superfície sobe e o céu golden hour nasce
 *  1.7s  logo emerge com anéis e brilho
 *  2.6s  varredura de luz + legenda Guarapari
 *  3.3s  aquecimento da home / Guará
 *  3.55s onda de espuma revela a home
 *  4.25s fim
 */

const T_WARM = 3300;
const T_EXIT = 3550;
const T_END = 4250;

type Phase = "boot" | "rise" | "emerge" | "shine" | "exit" | "done";

export function SplashScreen({ onWarm, onDone }: { onWarm?: () => void; onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("boot");
  const [ready, setReady] = useState(false);
  const doneRef = useRef(false);
  const warmRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const freeze = params.get("splash");
    if (freeze !== null && freeze !== "" && !Number.isNaN(Number(freeze))) {
      const t = Number(freeze);
      if (t >= 3.55) setPhase("exit");
      else if (t >= 2.6) setPhase("shine");
      else if (t >= 1.7) setPhase("emerge");
      else if (t >= 0.5) setPhase("rise");
      setReady(true);
      return undefined;
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    let started = false;
    const timers: number[] = [];
    const after = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, reduce ? Math.min(ms, 280) : ms));
    };

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
      setPhase("done");
      onDone();
    };

    const start = () => {
      if (cancelled || started) return;
      started = true;
      setReady(true);

      if (reduce) {
        setPhase("shine");
        after(120, warm);
        after(420, () => setPhase("exit"));
        after(780, finish);
        return;
      }

      setPhase("boot");
      after(90, () => setPhase("rise"));
      after(1700, () => setPhase("emerge"));
      after(2600, () => setPhase("shine"));
      after(T_WARM, warm);
      after(T_EXIT, () => setPhase("exit"));
      after(T_END, finish);
    };

    const logo = new Image();
    logo.decoding = "async";
    logo.src = "/logo.png";

    const failSafe = window.setTimeout(start, 700);
    const kick = () => {
      window.clearTimeout(failSafe);
      requestAnimationFrame(() => {
        if (!cancelled) start();
      });
    };
    logo.onload = kick;
    logo.onerror = kick;
    if (logo.complete) kick();

    return () => {
      cancelled = true;
      window.clearTimeout(failSafe);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [onDone, onWarm]);

  const live = phase !== "done";

  return (
    <div
      className={`pa-splash ${ready ? `is-${phase}` : "is-boot"} ${live ? "" : "is-gone"}`}
      role="presentation"
      aria-label="Abrindo Praia Alerta"
    >
      <div className="pa-splash-sky" aria-hidden>
        <span className="pa-splash-sun" />
        <span className="pa-splash-glow" />
        <span className="pa-splash-ridge pa-splash-ridge-a" />
        <span className="pa-splash-ridge pa-splash-ridge-b" />
        <span className="pa-splash-birds" />
      </div>

      <div className="pa-splash-water" aria-hidden>
        <span className="pa-splash-ray r1" />
        <span className="pa-splash-ray r2" />
        <span className="pa-splash-ray r3" />
        <span className="pa-splash-ray r4" />
        <span className="pa-splash-caustic" />
        <span className="pa-splash-bubble b1" />
        <span className="pa-splash-bubble b2" />
        <span className="pa-splash-bubble b3" />
        <span className="pa-splash-bubble b4" />
        <span className="pa-splash-bubble b5" />
        <span className="pa-splash-bubble b6" />
        <span className="pa-splash-sheen" />
      </div>

      <svg className="pa-splash-surface" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden>
        <path
          className="pa-splash-foam"
          d="M0 54C120 78 220 28 360 52C500 76 600 30 740 56C880 82 980 34 1120 58C1240 76 1340 48 1440 62L1440 120L0 120Z"
        />
        <path
          className="pa-splash-wave"
          d="M0 62C140 88 240 36 380 60C520 84 620 40 760 66C900 92 1000 44 1140 68C1260 86 1360 52 1440 70L1440 120L0 120Z"
        />
      </svg>

      <div className="pa-splash-logo-wrap">
        <span className="pa-splash-logo-halo" aria-hidden />
        <span className="pa-splash-logo-ring" aria-hidden />
        <span className="pa-splash-logo-ring delay" aria-hidden />
        <img className="pa-splash-logo" src="/logo.png" alt="" draggable={false} decoding="async" fetchPriority="high" />
        <span className="pa-splash-logo-sweep" aria-hidden />
      </div>

      <p className="pa-splash-caption">GUARAPARI · ES</p>

      <div className="pa-splash-exit" aria-hidden>
        <svg className="pa-splash-exit-wave" viewBox="0 0 1440 160" preserveAspectRatio="none">
          <path d="M0 70C160 30 280 110 440 70C600 30 720 110 880 70C1040 30 1200 110 1440 60L1440 160L0 160Z" fill="rgba(255,255,255,0.92)" />
          <path d="M0 86C180 50 300 120 460 86C620 52 760 120 920 86C1080 52 1260 120 1440 78L1440 160L0 160Z" fill="#02121b" />
        </svg>
      </div>
    </div>
  );
}
