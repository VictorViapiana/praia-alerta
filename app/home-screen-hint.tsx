"use client";

import { useEffect, useState } from "react";
import { isInAppBrowser, webApkWouldBeBlocked } from "./webapk-policy";

const DISMISS_KEY = "pa-home-hint-v1";

type Hint = "chrome" | "inapp";

function chromeIntent(pageUrl: string) {
  const url = new URL(pageUrl);
  const fallback = encodeURIComponent(pageUrl);
  const path = `${url.host}${url.pathname}${url.search}`;
  return `intent://${path}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallback};end`;
}

async function platformVersion(): Promise<string | null> {
  const uaData = (navigator as Navigator & {
    userAgentData?: { getHighEntropyValues?: (hints: string[]) => Promise<{ platformVersion?: string }> };
  }).userAgentData;
  if (!uaData?.getHighEntropyValues) return null;
  try {
    const values = await uaData.getHighEntropyValues(["platformVersion"]);
    return values.platformVersion ?? null;
  } catch {
    return null;
  }
}

export function HomeScreenHint() {
  const [hint, setHint] = useState<Hint | null>(null);

  useEffect(() => {
    let cancelled = false;
    const detect = async () => {
      try {
        if (localStorage.getItem(DISMISS_KEY) === "1") return;
      } catch {
        /* private mode */
      }
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (standalone) return;

      const ua = navigator.userAgent;
      if (!/Android/i.test(ua)) return;
      const version = await platformVersion();
      if (cancelled || !webApkWouldBeBlocked(ua, version)) return;
      setHint(isInAppBrowser(ua) ? "inapp" : "chrome");
    };
    void detect();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!hint) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode */
    }
    setHint(null);
  };

  return (
    <div
      role="region"
      aria-label="Ícone na tela inicial"
      className="glass-deep fixed inset-x-3 z-[190] rounded-2xl px-3 py-2.5 text-white"
      style={{ bottom: "calc(5.4rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 text-[12.5px] leading-snug">
          <span className="font-semibold">Ícone na tela inicial. </span>
          {hint === "inapp"
            ? "Abra no Chrome. Depois toque em ⋮ e escolha Adicionar à tela inicial."
            : "Toque em ⋮ no navegador e escolha Adicionar à tela inicial."}
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/15 text-sm"
        >
          ×
        </button>
      </div>
      {hint === "inapp" && (
        <a
          href={chromeIntent(window.location.href)}
          className="mt-2 inline-flex rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#0b3a66]"
        >
          Abrir no Chrome
        </a>
      )}
    </div>
  );
}
