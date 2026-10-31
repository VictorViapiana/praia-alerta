"use client";

import { useEffect, useState } from "react";

/** Fases do céu em horário de Guarapari (America/Sao_Paulo). */
export type SkyPhase = "dawn" | "day" | "dusk" | "night";

export type SkyPhaseInfo = {
  phase: SkyPhase;
  /** 0–1 progresso suave dentro da faixa (para misturas futuras) */
  blend: number;
  label: string;
  themeColor: string;
};

function hourInSaoPaulo(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 12);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour + minute / 60;
}

/** Faixas: madrugada → amanhecer → dia → entardecer → noite. */
export function skyPhaseAt(date = new Date()): SkyPhaseInfo {
  const h = hourInSaoPaulo(date);

  if (h >= 5 && h < 7.5) {
    return {
      phase: "dawn",
      blend: (h - 5) / 2.5,
      label: "Nascer do sol",
      themeColor: "#c9785a",
    };
  }
  if (h >= 7.5 && h < 16.5) {
    return {
      phase: "day",
      blend: (h - 7.5) / 9,
      label: "Dia na orla",
      themeColor: "#1d649c",
    };
  }
  if (h >= 16.5 && h < 19) {
    return {
      phase: "dusk",
      blend: (h - 16.5) / 2.5,
      label: "Fim de tarde",
      themeColor: "#b45a3c",
    };
  }
  return {
    phase: "night",
    blend: h >= 19 ? Math.min(1, (h - 19) / 3) : Math.min(1, h / 5),
    label: "Noite na orla",
    themeColor: "#0b2a48",
  };
}

/** Atualiza a cada minuto; respeita data-pa-surface=map (não mexe no theme do mapa). */
export function useSkyPhase() {
  const [info, setInfo] = useState<SkyPhaseInfo>(() => skyPhaseAt());

  useEffect(() => {
    const apply = () => {
      const next = skyPhaseAt();
      setInfo(next);
      document.documentElement.dataset.sky = next.phase;
      document.body.dataset.sky = next.phase;
      if (document.body.dataset.paSurface === "map") return;
      document.querySelectorAll('meta[name="theme-color"]').forEach((node) => {
        node.setAttribute("content", next.themeColor);
      });
      document.documentElement.style.setProperty("--pa-sky-theme", next.themeColor);
    };
    apply();
    const id = window.setInterval(apply, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return info;
}
