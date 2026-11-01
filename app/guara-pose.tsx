"use client";

import { GUARA_POSE, type GuaraPoseId } from "./guara-poses";

type Props = {
  pose: GuaraPoseId;
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
  priority?: boolean;
};

/** Ilustração do Guará — sempre PNG/WebP estático, sem next/image (PWA + Leaflet). */
export function GuaraPose({ pose, className = "", alt = "", width, height, priority = false }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={GUARA_POSE[pose]}
      alt={alt}
      width={width}
      height={height}
      draggable={false}
      decoding={priority ? "sync" : "async"}
      loading={priority ? "eager" : "lazy"}
      className={`pointer-events-none select-none object-contain ${className}`}
    />
  );
}
