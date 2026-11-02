import { NextRequest, NextResponse } from "next/server";
import { webApkWouldBeBlocked } from "../webapk-policy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ?v= busts launcher/favicon caches when the client re-adds the icon */
const ICONS = [
  { src: "/icons/icon-192.png?v=3", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icons/icon-512.png?v=3", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/icons/maskable-512.png?v=3", sizes: "512x512", type: "image/png", purpose: "maskable" },
];

export function GET(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "";
  const platformVersion = request.headers.get("sec-ch-ua-platform-version");
  const blocked = webApkWouldBeBlocked(userAgent, platformVersion);

  const manifest = {
    id: "/praia-alerta-guara",
    name: "Praia Alerta Guará",
    // short_name curto: cabe no rótulo do Android (o nome longo some ou vira atalho sem texto)
    short_name: "Praia Guará",
    description: "Guia e alerta da Praia do Morro — Guarapari, ES. Mapa, segurança e o Guará no bolso.",
    start_url: "/",
    scope: "/",
    display: blocked ? "browser" : "standalone",
    orientation: "portrait",
    background_color: "#0a3951",
    theme_color: "#1d649c",
    lang: "pt-BR",
    categories: ["travel", "navigation", "lifestyle"],
    icons: ICONS,
  };

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "private, no-store",
      Vary: "Sec-CH-UA-Platform-Version, User-Agent",
    },
  });
}
