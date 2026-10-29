import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { PwaRegister } from "./pwa-register";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Praia Alerta Alegretto",
  description: "Guia e alerta da Praia do Morro — Guarapari, ES. Mapa, segurança e o Guará no bolso.",
  applicationName: "Praia Alerta Alegretto",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Praia Alerta Alegretto",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0b4f7a" },
    { media: "(prefers-color-scheme: dark)", color: "#0b4f7a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preload" href="/logo-splash.png" as="image" type="image/png" />
        <link rel="preload" href="/pins/guara-mascot.webp" as="image" type="image/webp" />
        <link rel="preload" href="/guara-inteiro.png?v=1" as="image" type="image/png" />
        <link rel="stylesheet" href="/vendor/leaflet/leaflet.css" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Praia Alerta Alegretto" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className={`${outfit.variable} ${fraunces.variable} antialiased`}>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
