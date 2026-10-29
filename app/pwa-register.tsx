"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        // Força checagem para o iPhone não ficar preso no SW antigo (faixa azul / theme velho)
        void reg.update();
        if (reg.waiting) {
          reg.waiting.postMessage?.({ type: "SKIP_WAITING" });
        }
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          // uma vez só por ciclo de vida
          if ((window as unknown as { __paSwReloaded?: boolean }).__paSwReloaded) return;
          (window as unknown as { __paSwReloaded?: boolean }).__paSwReloaded = true;
          window.location.reload();
        });
      } catch {
        /* offline install can wait */
      }
    };

    if (document.readyState === "complete") void register();
    else window.addEventListener("load", () => void register(), { once: true });
  }, []);

  return null;
}
