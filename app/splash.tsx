"use client";

import { useEffect, useRef } from "react";

/**
 * Splash "Praia Alerta" — cena 100% em canvas 2D (sem vídeo/GIF).
 *
 *  0.0s  oceano profundo, raios de luz, cáusticas e bolhas; o logo brilha embaixo d'água
 *  0.5s  o logo sobe; a câmera emerge e revela o céu de golden hour, sol, serras e guarás
 *  1.9s  o logo rompe a superfície: respingos, ondas concêntricas, reflexo na água
 *  2.8s  brilho, varredura de luz e cintilações no logo
 *  3.65s onda de espuma varre a tela de baixo para cima revelando a home
 *
 * Qualidade adapta ao frame time para não travar em celular.
 */

const T_END = 4.55;
const TAU = Math.PI * 2;
const SURF = 0.6; // posição final da linha d'água (fração da altura)

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i += 1) {
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-5) break;
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    if (t < 0 || t > 1) {
      let lo = 0;
      let hi = 1;
      t = x;
      for (let i = 0; i < 24; i += 1) {
        if (sx(t) < x) lo = t;
        else hi = t;
        t = (lo + hi) / 2;
      }
    }
    return sy(t);
  };
}

const EASE_SURFACE = cubicBezier(0.25, 0.55, 0.2, 1);
const EASE_RISE = cubicBezier(0.22, 0.72, 0.2, 1);
const EASE_SCALE = cubicBezier(0.2, 0.8, 0.3, 1.18);
const EASE_EXIT = cubicBezier(0.6, 0, 0.3, 1);

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgb = (c: RGB, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

// ---------- elementos determinísticos (a cena é função pura do tempo) ----------
const rnd = mulberry32(20261027);

const BUBBLES = Array.from({ length: 28 }, () => ({
  x: rnd(),
  y0: rnd(),
  speed: 26 + rnd() * 90,
  r: 0.9 + rnd() * 3.6,
  wob: rnd() * TAU,
}));

const SPRAY = Array.from({ length: 54 }, () => ({
  spawn: 1.85 + rnd() * 0.85,
  ox: rnd() - 0.5,
  vx: (rnd() - 0.5) * 220,
  vy: 160 + rnd() * 460,
  size: 1 + rnd() * 2.6,
  gold: rnd() > 0.55,
  life: 0.9 + rnd() * 0.9,
}));

const GLITTER = Array.from({ length: 48 }, () => ({
  f: Math.pow(rnd(), 1.6),
  dx: rnd() - 0.5,
  w: 4 + rnd() * 20,
  ph: rnd() * TAU,
  sp: 2 + rnd() * 5,
}));

const CLOUDS = [
  { x: 0.08, y: 0.18, w: 190, h: 34, sp: 6 },
  { x: 0.55, y: 0.3, w: 250, h: 40, sp: 4 },
  { x: 0.85, y: 0.12, w: 170, h: 28, sp: 8 },
  { x: 0.3, y: 0.5, w: 230, h: 30, sp: 5 },
  { x: 0.7, y: 0.62, w: 200, h: 24, sp: 3 },
  { x: 0.15, y: 0.72, w: 260, h: 26, sp: 2.5 },
];

const SPARKS = [
  { a: -2.35, s: 1.0, t: 3.0 },
  { a: -0.7, s: 1.3, t: 3.15 },
  { a: 0.25, s: 0.8, t: 3.3 },
  { a: -1.45, s: 1.1, t: 3.4 },
  { a: 2.5, s: 0.9, t: 3.2 },
  { a: -3.0, s: 0.7, t: 3.5 },
];

const WATER_SHALLOW_DEEP: RGB = [6, 46, 70];
const WATER_SHALLOW_CLEAR: RGB = [22, 170, 186];
const WATER_MID_DEEP: RGB = [3, 24, 40];
const WATER_MID_CLEAR: RGB = [8, 96, 138];
const WATER_BOTTOM_DEEP: RGB = [1, 10, 20];
const WATER_BOTTOM_CLEAR: RGB = [3, 28, 52];

export function SplashScreen({ onWarm, onDone }: { onWarm?: () => void; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true }) ?? canvas.getContext("2d");
    if (!ctx) return undefined;

    const freezeParam = new URLSearchParams(window.location.search).get("splash");
    const frozenT = freezeParam !== null && freezeParam !== "" && !Number.isNaN(Number(freezeParam)) ? Number(freezeParam) : null;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let d = 0;
    let D = 0;
    let raf = 0;
    let disposed = false;
    let finished = false;
    let startedAt = 0;
    let ready = false;

    const logoImg = new Image();
    const logoC = document.createElement("canvas");
    const softC = document.createElement("canvas");
    const underC = document.createElement("canvas");
    const reflC = document.createElement("canvas");
    const fxC = document.createElement("canvas");
    const causC = document.createElement("canvas");
    const underCtx = underC.getContext("2d");
    const reflCtx = reflC.getContext("2d");
    const fxCtx = fxC.getContext("2d");
    const causCtx = causC.getContext("2d");
    let causImg: ImageData | null = null;
    let CW = 0;
    let CH = 0;
    let quality = 1;
    let lastNow = 0;
    let causFrame = 0;
    let causDirty = true;
    let warmed = false;
    const narrow = Math.min(window.innerWidth, window.innerHeight) < 520;
    // no celular prioriza fluidez; cáusticas pixel-a-pixel são o maior tilt
    let allowCaustics = !narrow;

    const buildLogo = () => {
      const lctx = logoC.getContext("2d");
      const sctx = softC.getContext("2d");
      if (!lctx || !sctx || !logoImg.complete || !logoImg.naturalWidth) return;
      logoC.width = D;
      logoC.height = D;
      lctx.imageSmoothingQuality = narrow ? "medium" : "high";
      lctx.clearRect(0, 0, D, D);
      lctx.drawImage(logoImg, 0, 0, D, D);

      const s = Math.max(8, Math.round(D / 14));
      const tmp = document.createElement("canvas");
      tmp.width = s;
      tmp.height = s;
      const tctx = tmp.getContext("2d");
      if (!tctx) return;
      tctx.drawImage(logoC, 0, 0, s, s);
      softC.width = D;
      softC.height = D;
      sctx.imageSmoothingEnabled = true;
      sctx.imageSmoothingQuality = "low";
      sctx.clearRect(0, 0, D, D);
      sctx.drawImage(tmp, 0, 0, D, D);
    };

    const resize = () => {
      const rawDpr = window.devicePixelRatio || 1;
      dpr = Math.min(rawDpr, narrow ? 1 : 1.35);
      W = canvas.clientWidth || window.innerWidth;
      H = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      d = Math.min(W * 0.78, H * 0.42);
      D = Math.max(16, Math.round(d * dpr));
      underC.width = D;
      underC.height = D;
      reflC.width = D;
      reflC.height = D;
      fxC.width = D;
      fxC.height = D;
      const cell = quality > 0.55 ? 12 : 16;
      CW = Math.ceil(W / cell);
      CH = Math.ceil(H / cell);
      causC.width = CW;
      causC.height = CH;
      causImg = causCtx ? causCtx.createImageData(CW, CH) : null;
      causDirty = true;
      buildLogo();
    };

    // ---------- helpers de desenho ----------
    const waveY = (x: number, t: number, sy: number, k: number) =>
      sy + k * (5.5 * Math.sin(x * 0.021 + t * 2.3) + 3.2 * Math.sin(x * 0.0085 - t * 1.4) + 1.6 * Math.sin(x * 0.05 + t * 3.7));

    const waveStep = () => (quality > 0.6 ? (narrow ? 10 : 8) : 14);

    const tracePath = (mode: "water" | "sky", t: number, sy: number, k: number) => {
      const step = waveStep();
      ctx.beginPath();
      ctx.moveTo(-2, waveY(-2, t, sy, k));
      for (let x = 0; x <= W + 8; x += step) ctx.lineTo(x, waveY(x, t, sy, k));
      if (mode === "water") {
        ctx.lineTo(W + 2, H + 2);
        ctx.lineTo(-2, H + 2);
      } else {
        ctx.lineTo(W + 2, -2);
        ctx.lineTo(-2, -2);
      }
      ctx.closePath();
    };

    const surfaceAt = (t: number) => lerp(-0.14 * H, SURF * H, EASE_SURFACE(clamp01((t - 0.3) / 2.3)));

    const drawStrips = (
      target: CanvasRenderingContext2D,
      src: HTMLCanvasElement,
      x: number,
      y: number,
      size: number,
      n: number,
      amp: number,
      freq: number,
      phase: number,
    ) => {
      const strips = Math.max(8, Math.round(n * (0.45 + 0.55 * quality)));
      const sh = src.height / strips;
      const dh = size / strips;
      for (let i = 0; i < strips; i += 1) {
        const off = amp ? amp * Math.sin((i / strips) * freq + phase) : 0;
        target.drawImage(src, 0, i * sh, src.width, sh + 0.6, x + off, y + i * dh, size, dh + 0.8);
      }
    };

    const star = (x: number, y: number, len: number, alpha: number) => {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.translate(x, y);
      for (let i = 0; i < 2; i += 1) {
        const g = ctx.createLinearGradient(-len, 0, len, 0);
        g.addColorStop(0, "rgba(255,240,200,0)");
        g.addColorStop(0.5, `rgba(255,248,225,${alpha})`);
        g.addColorStop(1, "rgba(255,240,200,0)");
        ctx.fillStyle = g;
        ctx.fillRect(-len, -0.9, len * 2, 1.8);
        ctx.rotate(Math.PI / 2);
      }
      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, len * 0.35);
      core.addColorStop(0, `rgba(255,255,255,${alpha})`);
      core.addColorStop(1, "rgba(255,230,170,0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(0, 0, len * 0.35, 0, TAU);
      ctx.fill();
      ctx.restore();
    };

    // ---------- renderização ----------
    const render = (t: number) => {
      if (!W || !H) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, W, H);

      const sy = surfaceAt(t);
      const surfP = clamp01((sy + 0.14 * H) / ((SURF + 0.14) * H));
      const clarity = smooth(0.9, 2.7, t);
      const bump = smooth(1.8, 2.1, t) * (1 - smooth(2.1, 3.6, t));
      const wk = 0.85 + 1.3 * bump + 0.5 * (1 - surfP);
      const sunX = W * 0.76;

      // logo
      const logoP = EASE_RISE(clamp01((t - 0.45) / 2.5));
      const ls0 = lerp(0.6, 1, EASE_SCALE(clamp01((t - 0.45) / 2.5)));
      const exitP = clamp01((t - 3.65) / 0.85);
      const exitE = EASE_EXIT(exitP);
      const ls = ls0 * (1 + 0.07 * exitE);
      const dd = d * ls;
      const restY = SURF * H - d * 0.5 * 0.8;
      const bob = Math.sin(t * 2.2) * 3 * smooth(2.4, 3.1, t);
      const lcy = lerp(0.86 * H, restY, logoP) + bob;
      const lx = W / 2 - dd / 2;
      const ly = lcy - dd / 2;
      const logoAlpha = smooth(0, 1.0, t) * (1 - smooth(0.25, 0.85, exitP));
      const hasLogo = logoC.width > 0 && logoC.height > 0 && logoImg.naturalWidth > 0;

      // base escura (nunca deixa o mapa aparecer antes da hora)
      ctx.fillStyle = "#02121b";
      ctx.fillRect(0, 0, W, H);

      // ===== CÉU golden hour =====
      if (sy > -30) {
        ctx.save();
        tracePath("sky", t, sy, wk);
        ctx.clip();
        const skyH = H * 0.66;
        const sg = ctx.createLinearGradient(0, sy - skyH, 0, sy);
        sg.addColorStop(0, "#0a1030");
        sg.addColorStop(0.3, "#2d2466");
        sg.addColorStop(0.55, "#8a3a78");
        sg.addColorStop(0.74, "#e0566a");
        sg.addColorStop(0.88, "#ff9a52");
        sg.addColorStop(1, "#ffe0a0");
        ctx.fillStyle = sg;
        ctx.fillRect(0, 0, W, sy + 20);

        // sol
        const sunY = sy - 0.105 * H - (1 - surfP) * 0.04 * H;
        const sunR = Math.min(W, H) * 0.075;
        ctx.globalCompositeOperation = "lighter";
        const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, H * 0.55);
        glow.addColorStop(0, "rgba(255,196,120,0.62)");
        glow.addColorStop(0.18, "rgba(255,150,80,0.34)");
        glow.addColorStop(0.5, "rgba(255,100,90,0.10)");
        glow.addColorStop(1, "rgba(255,100,90,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "source-over";
        const core = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
        core.addColorStop(0, "#fffbe8");
        core.addColorStop(0.55, "#fff0b8");
        core.addColorStop(1, "rgba(255,200,120,0.85)");
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR, 0, TAU);
        ctx.fill();

        // nuvens (parallax lento)
        for (const c of CLOUDS) {
          const cx = ((c.x * W + t * c.sp * 3 + 600) % (W + 520)) - 260;
          const cy = sy - skyH * (1 - c.y) + (1 - surfP) * 18;
          const warm = clamp01(1 - (sy - cy) / (skyH * 0.85));
          const col = mix([150, 110, 190], [255, 170, 130], warm);
          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(c.w, c.h);
          const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
          cg.addColorStop(0, rgb(col, 0.4));
          cg.addColorStop(0.6, rgb(col, 0.14));
          cg.addColorStop(1, rgb(col, 0));
          ctx.fillStyle = cg;
          ctx.beginPath();
          ctx.arc(0, 0, 1, 0, TAU);
          ctx.fill();
          ctx.restore();
        }

        // serras (Morro) em duas camadas
        const ridge = (x: number, amp: number, s: number) =>
          amp * (0.5 + 0.28 * Math.sin(x * 0.0042 + s) + 0.18 * Math.sin(x * 0.0113 + s * 2.1) + 0.1 * Math.sin(x * 0.027 + s * 3.3));
        const shift = (1 - surfP) * 26;
        const layers: Array<{ amp: number; s: number; col: RGB; a: number; px: number }> = [
          { amp: 0.085 * H, s: 1.2, col: [84, 52, 112], a: 0.9, px: 0.5 },
          { amp: 0.05 * H, s: 4.1, col: [34, 24, 64], a: 0.96, px: 1 },
        ];
        for (const l of layers) {
          ctx.beginPath();
          ctx.moveTo(-2, sy + 6);
          for (let x = -2; x <= W + 8; x += 8) ctx.lineTo(x, sy + 2 - ridge(x + shift * l.px, l.amp, l.s));
          ctx.lineTo(W + 2, sy + 6);
          ctx.closePath();
          ctx.fillStyle = rgb(l.col, l.a);
          ctx.fill();
        }

        // guarás voando em V
        const birdA = smooth(0.9, 1.7, surfP + 0.0) * (1 - smooth(0.2, 0.7, exitP));
        if (birdA > 0.01) {
          ctx.strokeStyle = `rgba(150,24,48,${0.9 * birdA})`;
          ctx.lineWidth = 1.7;
          ctx.lineCap = "round";
          for (let i = 0; i < 7; i += 1) {
            const rank = Math.ceil(i / 2);
            const side = i % 2 === 0 ? 1 : -1;
            const bx = W * 1.12 - ((t - 0.8) * 0.085 * W) - rank * 17 * side * -1 - rank * 20;
            const by = sy - 0.33 * H + rank * 11 * (i === 0 ? 0 : 1) * 1 + (side * rank * 6) + Math.sin(t * 1.3 + i) * 3;
            const flap = Math.sin(t * 9 + i * 0.7);
            const s = 9 - rank * 0.6;
            ctx.beginPath();
            ctx.moveTo(bx - s, by - flap * s * 0.7);
            ctx.quadraticCurveTo(bx - s * 0.45, by - s * 0.45 - flap * s * 0.3, bx, by);
            ctx.quadraticCurveTo(bx + s * 0.45, by - s * 0.45 - flap * s * 0.3, bx + s, by - flap * s * 0.7);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // ===== ÁGUA =====
      ctx.save();
      tracePath("water", t, sy, wk);
      ctx.clip();

      const wg = ctx.createLinearGradient(0, sy, 0, H);
      wg.addColorStop(0, rgb(mix(WATER_SHALLOW_DEEP, WATER_SHALLOW_CLEAR, clarity)));
      wg.addColorStop(0.35, rgb(mix(WATER_MID_DEEP, WATER_MID_CLEAR, clarity)));
      wg.addColorStop(1, rgb(mix(WATER_BOTTOM_DEEP, WATER_BOTTOM_CLEAR, clarity)));
      ctx.fillStyle = wg;
      ctx.fillRect(0, Math.min(sy, 0) - 4, W, H + 8);

      // reflexo do céu/sol (coluna dourada) quando já emergiu
      if (clarity > 0.02 && sy > 0) {
        ctx.globalCompositeOperation = "lighter";
        const sunCol = ctx.createLinearGradient(0, sy, 0, H);
        sunCol.addColorStop(0, `rgba(255,190,110,${0.5 * clarity})`);
        sunCol.addColorStop(0.5, `rgba(255,120,80,${0.12 * clarity})`);
        sunCol.addColorStop(1, "rgba(255,120,80,0)");
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(sunX - 18, sy);
        ctx.lineTo(sunX + 18, sy);
        ctx.lineTo(sunX + 150, H);
        ctx.lineTo(sunX - 150, H);
        ctx.closePath();
        ctx.fillStyle = sunCol;
        ctx.fill();
        ctx.restore();

        // glitter do sol (amostra conforme qualidade)
        const glitterN = Math.round(GLITTER.length * (0.45 + 0.55 * quality));
        for (let gi = 0; gi < glitterN; gi += 1) {
          const g = GLITTER[gi];
          const yy = sy + 4 + g.f * (H - sy) * 0.95;
          const spread = 14 + g.f * (H - sy) * 0.3;
          const flick = 0.35 + 0.65 * Math.max(0, Math.sin(t * g.sp + g.ph));
          const a = (0.95 - g.f * 0.7) * flick * clarity;
          if (a < 0.03) continue;
          ctx.fillStyle = `rgba(255,226,170,${a})`;
          ctx.fillRect(sunX + g.dx * spread * 2 - g.w / 2, yy, g.w * (0.5 + g.f), 1.5);
        }
        ctx.globalCompositeOperation = "source-over";
      }

      // raios de luz vindos da superfície
      const rayA = 0.2 * (1 - 0.6 * clarity);
      if (rayA > 0.01 && quality > 0.25) {
        ctx.globalCompositeOperation = "lighter";
        const rayN = quality > 0.7 ? 8 : 5;
        for (let i = 0; i < rayN; i += 1) {
          const baseX = (i / 7) * W * 1.25 - W * 0.12 + Math.sin(t * 0.6 + i * 1.7) * 18;
          const w0 = 12 + (i % 3) * 8;
          const slope = 0.32 + Math.sin(t * 0.4 + i) * 0.04;
          const len = H * 1.1;
          const y0 = sy;
          const g = ctx.createLinearGradient(0, y0, 0, y0 + len);
          const a = rayA * (0.55 + 0.45 * Math.sin(t * 1.3 + i * 2.1));
          g.addColorStop(0, `rgba(150,235,255,${a})`);
          g.addColorStop(1, "rgba(150,235,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(baseX - w0, y0);
          ctx.lineTo(baseX + w0, y0);
          ctx.lineTo(baseX + slope * len + w0 * 4, y0 + len);
          ctx.lineTo(baseX + slope * len - w0 * 4, y0 + len);
          ctx.closePath();
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      }

      // cáusticas (desliga no celular / qualidade baixa)
      if (allowCaustics && causCtx && causImg && quality > 0.45) {
        causFrame += 1;
        const every = quality > 0.75 ? 3 : 4;
        if (causDirty || causFrame % every === 0) {
          causDirty = false;
          const data = causImg.data;
          let p = 0;
          const tt = t;
          const cell = W / CW;
          for (let cy = 0; cy < CH; cy += 1) {
            const v = cy * 0.21;
            for (let cx = 0; cx < CW; cx += 1) {
              const u = cx * 0.21;
              const a = Math.sin(u * 1.3 + Math.sin(v * 0.9 + tt * 1.1) * 1.7 + tt * 0.6);
              const b = Math.sin(v * 1.1 + Math.sin(u * 0.8 - tt * 0.9) * 1.9 - tt * 0.5);
              const c = Math.sin((u + v) * 0.9 + tt * 0.8);
              let r = 1 - Math.abs(((a + b + c) / 3) * 1.6);
              if (r < 0) r = 0;
              r = r * r * r * r;
              const depth = clamp01((cy * cell - sy) / (H - sy + 1));
              const alpha = clamp01(r * 1.25) * (1 - depth * 0.55) * 255;
              data[p] = 190;
              data[p + 1] = 245;
              data[p + 2] = 255;
              data[p + 3] = alpha;
              p += 4;
            }
          }
          causCtx.putImageData(causImg, 0, 0);
        }
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.16 + 0.14 * (1 - clarity);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(causC, 0, 0, W, H);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }

      // brilho logo abaixo da linha d'água
      if (sy > -10) {
        ctx.globalCompositeOperation = "lighter";
        const sg2 = ctx.createLinearGradient(0, sy, 0, sy + H * 0.09);
        sg2.addColorStop(0, `rgba(255,214,160,${0.1 + 0.2 * clarity})`);
        sg2.addColorStop(1, "rgba(255,214,160,0)");
        ctx.fillStyle = sg2;
        ctx.fillRect(0, sy, W, H * 0.09 + 6);
        ctx.globalCompositeOperation = "source-over";
      }

      // bolhas
      const bubbleA = 0.6 * (1 - 0.55 * clarity) * (1 - smooth(0.2, 0.7, exitP));
      const bubbleN = Math.round(BUBBLES.length * (0.55 + 0.45 * quality));
      for (let bi = 0; bi < bubbleN; bi += 1) {
        const b = BUBBLES[bi];
        const span = H + 40;
        const y = H + 20 - ((b.y0 * span + b.speed * t) % span);
        if (y < sy + 4) continue;
        const x = b.x * W + Math.sin(t * 1.7 + b.wob) * 8;
        ctx.strokeStyle = `rgba(200,240,255,${bubbleA})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, b.r, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${bubbleA * 0.7})`;
        ctx.fillRect(x - b.r * 0.4, y - b.r * 0.5, Math.max(1, b.r * 0.35), Math.max(1, b.r * 0.35));
      }

      // bloom do logo ainda submerso
      if (hasLogo) {
        const bloomA = 0.42 * (1 - clarity * 0.7) * smooth(0, 0.8, t);
        ctx.globalCompositeOperation = "lighter";
        const bl = ctx.createRadialGradient(W / 2, lcy, 0, W / 2, lcy, d * 0.95);
        bl.addColorStop(0, `rgba(120,220,255,${bloomA})`);
        bl.addColorStop(0.5, `rgba(40,150,210,${bloomA * 0.4})`);
        bl.addColorStop(1, "rgba(40,150,210,0)");
        ctx.fillStyle = bl;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "source-over";
      }

      // reflexo do logo (apenas parte acima da linha d'água)
      if (hasLogo && reflCtx && quality > 0.35) {
        const reflA = smooth(0.1, 0.9, (sy - lcy) / (dd * 0.5)) * logoAlpha * 0.6;
        if (reflA > 0.01) {
          reflCtx.clearRect(0, 0, D, D);
          drawStrips(reflCtx, logoC, 0, 0, D, 36, 7 * dpr, 34, t * 3.2);
          reflCtx.globalCompositeOperation = "destination-in";
          const fg = reflCtx.createLinearGradient(0, D, 0, D * 0.12);
          fg.addColorStop(0, "rgba(0,0,0,0.9)");
          fg.addColorStop(1, "rgba(0,0,0,0)");
          reflCtx.fillStyle = fg;
          reflCtx.fillRect(0, 0, D, D);
          reflCtx.globalCompositeOperation = "source-over";

          ctx.save();
          ctx.translate(0, 2 * sy);
          ctx.scale(1, -1);
          ctx.beginPath();
          ctx.rect(0, 0, W, sy);
          ctx.clip();
          ctx.globalAlpha = reflA;
          ctx.drawImage(reflC, lx, ly, dd, dd);
          ctx.restore();
          ctx.globalAlpha = 1;
        }
      }

      // parte submersa do logo: refração, desfoque e tinta de água
      if (hasLogo && underCtx && logoAlpha > 0.01 && ly + dd > sy - 20) {
        const blurK = 1 - smooth(0.2, 1.9, t);
        const amp = 9 * (1 - 0.55 * clarity) * dpr;
        underCtx.clearRect(0, 0, D, D);
        underCtx.globalCompositeOperation = "source-over";
        if (quality > 0.45) {
          underCtx.globalAlpha = 1 - blurK;
          drawStrips(underCtx, logoC, 0, 0, D, 28, amp, 22, t * 4);
          underCtx.globalAlpha = blurK;
          drawStrips(underCtx, softC, 0, 0, D, 16, amp * 0.6, 22, t * 4);
        } else {
          underCtx.globalAlpha = 1;
          underCtx.drawImage(blurK > 0.5 ? softC : logoC, 0, 0, D, D);
        }
        underCtx.globalAlpha = 1;
        underCtx.globalCompositeOperation = "source-atop";
        underCtx.fillStyle = rgb(mix([4, 60, 92], [10, 130, 160], clarity), 0.5 - 0.25 * clarity);
        underCtx.fillRect(0, 0, D, D);
        underCtx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = logoAlpha * (0.78 + 0.22 * clarity);
        ctx.drawImage(underC, lx, ly, dd, dd);
        ctx.globalAlpha = 1;
      }

      // ondas concêntricas na superfície
      for (const t0 of [1.95, 2.3, 2.7]) {
        const tau = t - t0;
        if (tau < 0 || tau > 1.6) continue;
        const rx = tau * d * 0.95 + 8;
        const ry = rx * 0.1;
        const a = (1 - tau / 1.6) * 0.55;
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = `rgba(225,246,255,${a})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(W / 2, sy + ry * 0.4 + 2, rx, ry, 0, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = `rgba(255,214,160,${a * 0.5})`;
        ctx.beginPath();
        ctx.ellipse(W / 2, sy + ry * 0.4 + 2, rx * 0.8, ry * 0.8, 0, 0, TAU);
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.restore(); // fim clip água

      // linha d'água: espuma e brilho
      if (sy > -20) {
        const foamA = smooth(-0.05 * H, 0.15 * H, sy);
        const traceLine = () => {
          ctx.beginPath();
          for (let x = -2; x <= W + 8; x += 6) {
            const y = waveY(x, t, sy, wk);
            if (x === -2) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        };
        ctx.save();
        ctx.lineJoin = "round";
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = `rgba(255,214,160,${0.09 * foamA})`;
        ctx.lineWidth = 14;
        traceLine();
        ctx.stroke();
        ctx.strokeStyle = `rgba(255,240,215,${0.28 * foamA})`;
        ctx.lineWidth = 4;
        traceLine();
        ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${0.75 * foamA})`;
        ctx.lineWidth = 1.3;
        traceLine();
        ctx.stroke();
        ctx.restore();
      }

      // ===== LOGO acima da água =====
      if (hasLogo && logoAlpha > 0.01) {
        ctx.save();
        tracePath("sky", t, sy, wk);
        ctx.clip();

        // halo dourado
        const haloA = smooth(1.9, 2.8, t) * (0.3 + 0.1 * Math.sin(t * 3)) * (1 - smooth(0.2, 0.7, exitP));
        if (haloA > 0.01) {
          ctx.globalCompositeOperation = "lighter";
          const hg = ctx.createRadialGradient(W / 2, lcy, d * 0.3, W / 2, lcy, d * 0.95);
          hg.addColorStop(0, `rgba(255,200,120,${haloA})`);
          hg.addColorStop(0.55, `rgba(255,150,90,${haloA * 0.35})`);
          hg.addColorStop(1, "rgba(255,150,90,0)");
          ctx.fillStyle = hg;
          ctx.fillRect(0, 0, W, H);
          ctx.globalCompositeOperation = "source-over";
        }

        ctx.globalAlpha = logoAlpha;
        ctx.drawImage(logoC, lx, ly, dd, dd);
        ctx.globalAlpha = 1;

        // varredura de luz
        const sweep = clamp01((t - 2.85) / 0.75);
        if (sweep > 0 && sweep < 1 && fxCtx) {
          fxCtx.clearRect(0, 0, D, D);
          fxCtx.globalCompositeOperation = "source-over";
          fxCtx.drawImage(logoC, 0, 0, D, D);
          fxCtx.globalCompositeOperation = "source-atop";
          const px = lerp(-0.4, 1.4, EASE_RISE(sweep)) * D;
          const sg3 = fxCtx.createLinearGradient(px - D * 0.22, 0, px + D * 0.22, D * 0.4);
          sg3.addColorStop(0, "rgba(255,255,255,0)");
          sg3.addColorStop(0.5, "rgba(255,248,225,0.85)");
          sg3.addColorStop(1, "rgba(255,255,255,0)");
          fxCtx.fillStyle = sg3;
          fxCtx.fillRect(0, 0, D, D);
          fxCtx.globalCompositeOperation = "source-over";
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = logoAlpha;
          ctx.drawImage(fxC, lx, ly, dd, dd);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = "source-over";
        }

        // cintilações
        for (const s of SPARKS) {
          const tau = (t - s.t) / 0.55;
          if (tau < 0 || tau > 1) continue;
          const env = Math.sin(tau * Math.PI);
          const sx = W / 2 + Math.cos(s.a) * dd * 0.46;
          const sy2 = lcy + Math.sin(s.a) * dd * 0.46;
          star(sx, sy2, 18 * s.s * env + 4, env);
        }
        ctx.restore();
      }

      // ===== respingos e névoa =====
      if (t > 1.8 && t < 4.3) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const mistA = smooth(1.8, 2.2, t) * (1 - smooth(2.4, 3.6, t)) * 0.28;
        if (mistA > 0.01) {
          for (let i = 0; i < 4; i += 1) {
            const mx = W / 2 + (i - 1.5) * d * 0.34;
            const my = sy - 6 - Math.sin(t * 1.4 + i) * 6;
            const mg = ctx.createRadialGradient(mx, my, 0, mx, my, d * 0.4);
            mg.addColorStop(0, `rgba(255,236,210,${mistA})`);
            mg.addColorStop(1, "rgba(255,236,210,0)");
            ctx.fillStyle = mg;
            ctx.beginPath();
            ctx.ellipse(mx, my, d * 0.4, d * 0.16, 0, 0, TAU);
            ctx.fill();
          }
        }
        const G = 980;
        const sprayN = Math.round(SPRAY.length * (0.5 + 0.5 * quality));
        const surfNow = surfaceAt(t);
        for (let si = 0; si < sprayN; si += 1) {
          const p = SPRAY[si];
          const tau = t - p.spawn;
          if (tau < 0 || tau > p.life) continue;
          const y0 = surfaceAt(p.spawn);
          const qx = W / 2 + p.ox * d * 0.95 + p.vx * tau;
          const qy = y0 - p.vy * tau + 0.5 * G * tau * tau;
          if (qy > surfNow + 3) continue;
          const prevT = Math.max(0, tau - 0.022);
          const px = W / 2 + p.ox * d * 0.95 + p.vx * prevT;
          const py = y0 - p.vy * prevT + 0.5 * G * prevT * prevT;
          const a = (1 - tau / p.life) * 0.85;
          ctx.strokeStyle = p.gold ? `rgba(255,214,150,${a})` : `rgba(235,250,255,${a})`;
          ctx.lineWidth = p.size * 0.75;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(qx, qy);
          ctx.stroke();
        }
        ctx.restore();
      }

      // legenda
      const capA = smooth(2.9, 3.5, t) * (1 - smooth(0.1, 0.5, exitP));
      if (capA > 0.01) {
        const text = "GUARAPARI · ES";
        ctx.save();
        ctx.font = "600 11px system-ui, -apple-system, 'Segoe UI', sans-serif";
        ctx.textBaseline = "middle";
        ctx.fillStyle = `rgba(210,240,250,${0.85 * capA})`;
        const spacing = 5.5;
        let total = 0;
        for (const ch of text) total += ctx.measureText(ch).width + spacing;
        total -= spacing;
        let x = W / 2 - total / 2;
        const ty = Math.min(H - 36, sy + (H - sy) * 0.62);
        for (const ch of text) {
          ctx.fillText(ch, x, ty);
          x += ctx.measureText(ch).width + spacing;
        }
        ctx.restore();
      }

      // vinheta
      const vg = ctx.createRadialGradient(W / 2, H * 0.48, Math.min(W, H) * 0.35, W / 2, H * 0.48, Math.max(W, H) * 0.8);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,6,14,0.55)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      // ===== SAÍDA: onda de espuma revela o mapa =====
      if (exitP > 0) {
        const front = H * (1.14 - 1.3 * exitE);
        const fy = (x: number) => front + 13 * Math.sin(x * 0.02 + t * 5) + 8 * Math.sin(x * 0.052 - t * 3.1) + 4 * Math.sin(x * 0.11 + t * 7);
        const line = () => {
          ctx.beginPath();
          for (let x = -2; x <= W + 8; x += 5) {
            if (x === -2) ctx.moveTo(x, fy(x));
            else ctx.lineTo(x, fy(x));
          }
        };
        ctx.save();
        ctx.lineJoin = "round";
        ctx.strokeStyle = "rgba(255,255,255,0.13)";
        ctx.lineWidth = 46;
        line();
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.28)";
        ctx.lineWidth = 22;
        line();
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 7;
        line();
        ctx.stroke();
        // bolhas de espuma na frente da onda
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        const foamN = quality > 0.5 ? 28 : 14;
        for (let i = 0; i < foamN; i += 1) {
          const x = ((i * 97.3) % (W + 20)) - 10;
          const off = Math.sin(i * 12.9898 + t * 2) * 14 - 10;
          ctx.beginPath();
          ctx.arc(x, fy(x) + off, 1 + ((i * 7) % 3), 0, TAU);
          ctx.fill();
        }
        // apaga tudo abaixo da onda (revela a home)
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.moveTo(-2, fy(-2) + 4);
        for (let x = 0; x <= W + 8; x += 5) ctx.lineTo(x, fy(x) + 4);
        ctx.lineTo(W + 2, H + 60);
        ctx.lineTo(-2, H + 60);
        ctx.closePath();
        ctx.fillStyle = "#000";
        ctx.fill();
        ctx.restore();
      }
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      onDone();
    };

    const warmUp = () => {
      if (warmed) return;
      warmed = true;
      // pré-decodifica o Guará enquanto a splash ainda cobre a tela
      for (const src of ["/guara-inteiro.png?v=1", "/guara.png?v=3"]) {
        const img = new Image();
        img.decoding = "async";
        img.src = src;
        void img.decode?.().catch(() => undefined);
      }
      onWarm?.();
    };

    const loop = (now: number) => {
      if (disposed) return;
      if (!startedAt) startedAt = now;
      if (lastNow) {
        const dt = now - lastNow;
        if (dt > 26) {
          quality = Math.max(0.15, quality - 0.25);
          if (narrow) allowCaustics = false;
        } else if (dt < 17) quality = Math.min(1, quality + 0.03);
      }
      lastNow = now;
      const t = (now - startedAt) / 1000;
      if (t >= 3.35) warmUp();
      render(Math.min(t, T_END));
      if (t >= T_END) {
        finish();
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (disposed || ready) return;
      ready = true;
      buildLogo();
      if (frozenT !== null) {
        render(frozenT);
      } else {
        raf = requestAnimationFrame(loop);
      }
    };

    resize();
    // primeiro quadro opaco enquanto o logo carrega
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#02121b";
    ctx.fillRect(0, 0, W, H);

    // começa a cena imediatamente; o logo entra quando carregar
    start();
    logoImg.onload = () => {
      if (disposed) return;
      // evita hitch no meio do frame da splash
      requestAnimationFrame(() => {
        if (!disposed) buildLogo();
      });
    };
    logoImg.onerror = () => undefined;
    logoImg.decoding = "async";
    logoImg.src = "/logo.png";
    if (logoImg.complete) buildLogo();

    const failSafe = window.setTimeout(() => {
      if (!ready) start();
    }, 1800);

    const onResize = () => {
      resize();
      if (ready && frozenT !== null) render(frozenT);
    };
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(failSafe);
      window.removeEventListener("resize", onResize);
    };
  }, [onDone, onWarm]);

  return (
    <div
      className="fixed inset-0 z-[200] touch-none select-none bg-[#02121b]"
      role="presentation"
      aria-label="Abrindo Praia Alerta"
    >
      <canvas ref={canvasRef} className="block h-full w-full" style={{ background: "#02121b" }} />
    </div>
  );
}
