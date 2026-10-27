"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const EASE_RISE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_WAVE: [number, number, number, number] = [0.45, 0.05, 0.25, 1];
const TOTAL_MS = 3600;

function SunGlow() {
  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-[12%] h-[42vmin] w-[42vmin] -translate-x-1/2 rounded-full"
      style={{
        background:
          "radial-gradient(circle, rgba(255,214,140,0.95) 0%, rgba(251,146,60,0.45) 32%, rgba(14,116,144,0.12) 58%, transparent 72%)",
        filter: "blur(2px)",
      }}
      initial={{ opacity: 0, scale: 0.55 }}
      animate={{ opacity: 1, scale: 1.08 }}
      transition={{ duration: 1.6, ease: EASE_RISE }}
    />
  );
}

function LightRays() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.7 }}
      transition={{ duration: 1.4, delay: 0.2 }}
    >
      {[-28, -14, 0, 14, 28].map((deg, index) => (
        <span
          key={deg}
          className="absolute left-1/2 top-[8%] h-[70%] w-[min(18vw,5.5rem)] origin-top -translate-x-1/2"
          style={{
            transform: `translateX(-50%) rotate(${deg}deg)`,
            background: `linear-gradient(180deg, rgba(255,220,160,${0.28 - index * 0.03}) 0%, transparent 78%)`,
            filter: "blur(1px)",
          }}
        />
      ))}
    </motion.div>
  );
}

function FoamCrest({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute inset-x-0 top-0 h-8"
      style={{
        background:
          "radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.35) 40%, transparent 70%)",
      }}
      animate={{ x: ["-6%", "6%", "-4%"], opacity: [0.55, 0.95, 0.6] }}
      transition={{ duration: 3.2, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function OceanLayers() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #071a2a 0%, #0a3a52 28%, #0e7490 52%, #155e75 72%, #083344 100%)",
        }}
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 3.4, ease: EASE_WAVE }}
      />
      <motion.div
        className="absolute -left-[10%] top-[18%] h-[50%] w-[120%] rounded-[100%] opacity-40"
        style={{
          background: "radial-gradient(ellipse, rgba(56,189,248,0.35) 0%, transparent 70%)",
          filter: "blur(28px)",
        }}
        animate={{ x: ["-4%", "5%", "-3%"], y: ["0%", "3%", "0%"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 720" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id="splash-wave-a" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0e7490" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="splash-wave-b" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.7" />
            <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#082f49" stopOpacity="0.4" />
          </linearGradient>
          <filter id="splash-soft">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>
        <motion.path
          d="M-40 420 C 40 390, 90 455, 160 430 S 280 390, 360 425 S 440 470, 480 445 L 480 760 L -40 760 Z"
          fill="url(#splash-wave-a)"
          filter="url(#splash-soft)"
          animate={{ d: [
            "M-40 420 C 40 390, 90 455, 160 430 S 280 390, 360 425 S 440 470, 480 445 L 480 760 L -40 760 Z",
            "M-40 435 C 50 470, 100 400, 170 445 S 270 480, 350 430 S 430 400, 480 450 L 480 760 L -40 760 Z",
            "M-40 420 C 40 390, 90 455, 160 430 S 280 390, 360 425 S 440 470, 480 445 L 480 760 L -40 760 Z",
          ] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M-40 470 C 30 450, 110 510, 180 485 S 300 450, 380 490 S 450 520, 500 495 L 500 760 L -40 760 Z"
          fill="url(#splash-wave-b)"
          animate={{ d: [
            "M-40 470 C 30 450, 110 510, 180 485 S 300 450, 380 490 S 450 520, 500 495 L 500 760 L -40 760 Z",
            "M-40 490 C 60 520, 120 460, 200 500 S 310 540, 390 480 S 460 460, 500 505 L 500 760 L -40 760 Z",
            "M-40 470 C 30 450, 110 510, 180 485 S 300 450, 380 490 S 450 520, 500 495 L 500 760 L -40 760 Z",
          ] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M-40 540 C 50 520, 120 575, 200 550 S 320 520, 400 560 S 470 590, 520 565 L 520 760 L -40 760 Z"
          fill="rgba(8,47,73,0.85)"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-[38%] overflow-hidden">
        <FoamCrest delay={0} />
        <motion.div
          className="absolute inset-x-[-20%] bottom-0 h-full"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(224,242,254,0.18) 18%, rgba(12,74,110,0.55) 48%, #041018 100%)",
          }}
          animate={{ x: ["0%", "4%", "-3%", "0%"] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

function WaterRefraction() {
  return (
    <div className="pointer-events-none absolute inset-0 mix-blend-soft-light">
      <svg className="h-full w-full" aria-hidden>
        <defs>
          <filter id="splash-refract" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="3" seed="7" result="noise">
              <animate attributeName="baseFrequency" dur="8s" values="0.012 0.03;0.018 0.04;0.012 0.03" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="rgba(125,211,252,0.12)" filter="url(#splash-refract)" />
      </svg>
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "contrast(1.05) saturate(1.15)",
          WebkitBackdropFilter: "contrast(1.05) saturate(1.15)",
        }}
      />
    </div>
  );
}

function BrandMark() {
  return (
    <motion.div
      className="relative z-10 flex flex-col items-center px-8 text-center"
      initial={{ opacity: 0, y: 72, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 1.35, delay: 0.85, ease: EASE_RISE }}
    >
      <motion.div
        className="relative mb-5 grid h-20 w-20 place-items-center rounded-full border border-white/30 bg-white/10 shadow-[0_0_40px_rgba(56,189,248,0.45)] backdrop-blur-md"
        animate={{ boxShadow: ["0 0 28px rgba(56,189,248,0.35)", "0 0 52px rgba(251,191,36,0.55)", "0 0 28px rgba(56,189,248,0.35)"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden>
          <circle cx="40" cy="20" r="8" fill="#fbbf24" opacity="0.95" />
          <path d="M8 40c8-6 14 4 22 0s14-8 26-2v18H8V40Z" fill="#7dd3fc" opacity="0.9" />
          <path d="M8 48c10-5 16 3 24-1s12-6 24 0v10H8V48Z" fill="#38bdf8" opacity="0.75" />
          <circle cx="24" cy="36" r="7" fill="none" stroke="#e11d48" strokeWidth="3.2" />
          <circle cx="24" cy="36" r="2.8" fill="#041018" />
        </svg>
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)",
          }}
          initial={{ x: "-120%" }}
          animate={{ x: "120%" }}
          transition={{ duration: 1.1, delay: 1.6, ease: "easeInOut" }}
        />
      </motion.div>
      <motion.p
        className="text-[11px] font-semibold uppercase tracking-[0.42em] text-cyan-100/80"
        initial={{ opacity: 0, letterSpacing: "0.55em" }}
        animate={{ opacity: 1, letterSpacing: "0.42em" }}
        transition={{ duration: 1, delay: 1.15, ease: EASE_RISE }}
      >
        Guarapari · ES
      </motion.p>
      <motion.h1
        className="mt-2 font-serif text-[clamp(2.4rem,9vw,3.4rem)] italic leading-none text-white"
        style={{
          textShadow: "0 0 28px rgba(125,211,252,0.55), 0 8px 32px rgba(0,0,0,0.45)",
        }}
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, delay: 1.05, ease: EASE_RISE }}
      >
        Praia Alerta
      </motion.h1>
      <motion.p
        className="mt-3 max-w-[16rem] text-[13px] leading-relaxed text-cyan-50/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 1.45 }}
      >
        A orla no bolso. Segurança, mapa e o Guará com você.
      </motion.p>
    </motion.div>
  );
}

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveAt = window.setTimeout(() => setLeaving(true), TOTAL_MS - 700);
    const doneAt = window.setTimeout(onDone, TOTAL_MS);
    return () => {
      window.clearTimeout(leaveAt);
      window.clearTimeout(doneAt);
    };
  }, [onDone]);

  return (
    <AnimatePresence mode="wait">
      {!leaving ? (
        <motion.div
          key="splash"
          role="presentation"
          aria-label="Abrindo Praia Alerta"
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#041018]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(16px)" }}
          transition={{ duration: 0.7, ease: EASE_WAVE }}
        >
          <OceanLayers />
          <SunGlow />
          <LightRays />
          <WaterRefraction />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
            }}
          />
          <BrandMark />
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
            style={{ background: "linear-gradient(180deg, transparent, rgba(4,16,24,0.85))" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 0.8 }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
