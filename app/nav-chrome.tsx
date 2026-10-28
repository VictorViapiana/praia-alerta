"use client";

import { useEffect, useRef, type ButtonHTMLAttributes } from "react";
import { X } from "lucide-react";

/** Botão X com área de toque grande e fora do notch / Dynamic Island. */
export function CloseButton({
  onClose,
  light = false,
  className = "",
  ...rest
}: {
  onClose: () => void;
  light?: boolean;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type" | "aria-label" | "children">) {
  return (
    <button
      type="button"
      aria-label="Fechar"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
      className={[
        "pointer-events-auto relative z-[90] grid h-11 w-11 place-items-center rounded-full border text-white touch-manipulation",
        "before:absolute before:-inset-3 before:content-['']",
        light
          ? "border-white/45 bg-black/55 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md"
          : "border-white/30 bg-white/18 shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-md",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <X className="h-[18px] w-[18px]" strokeWidth={2.2} />
    </button>
  );
}

/** Classes utilitárias para ancorar o fechar abaixo da safe area / Dynamic Island. */
export const closeTopClass =
  "absolute right-3 z-[90] top-[max(0.75rem,calc(env(safe-area-inset-top,0px)+0.35rem))]";

/**
 * Gesto iOS: começa na borda esquerda e puxa para a direita → volta.
 * Desative no mapa (`enabled={false}`) para não sair ao arrastar a orla.
 */
export function useEdgeSwipeBack(enabled: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!enabled) return;

    let active = false;
    let startX = 0;
    let startY = 0;
    let locked = false;

    const reset = () => {
      active = false;
      locked = false;
    };

    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      // só a faixa bem da esquerda (gesture iOS)
      if (touch.clientX > 26) return;
      active = true;
      locked = false;
      startX = touch.clientX;
      startY = touch.clientY;
    };

    const onMove = (event: TouchEvent) => {
      if (!active || locked) return;
      const touch = event.touches[0];
      const dx = touch.clientX - startX;
      const dy = Math.abs(touch.clientY - startY);
      if (dy > 54) {
        reset();
        return;
      }
      if (dx > 78 && dx > dy * 1.35) {
        locked = true;
        active = false;
        onBackRef.current();
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", reset, { passive: true });
    window.addEventListener("touchcancel", reset, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", reset);
      window.removeEventListener("touchcancel", reset);
    };
  }, [enabled]);
}

/** Entrada limpa de tela cheia — só fade (sem layoutId / sem slide = sem tilt no Android). */
export const screenEnter = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const },
};
