"use client";

import { Camera, Check, Download, Heart, Share2, SwitchCamera, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Facing = "user" | "environment";

const FRAME_ASSET = "/frames/eu-amo-guarapari.png?v=5";

export function CameraFab({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      data-map-ui
      data-onboard="map-camera"
      onClick={onOpen}
      aria-label="Eu amo Guarapari. Abrir a câmera."
      className="group flex flex-col items-center gap-1.5 overflow-visible rounded-[28px] pb-1"
      style={{
        position: "absolute",
        right: 20,
        /* Mesma altura do Guará — acima do chrome de busca/filtros */
        bottom: "max(13.5rem, calc(env(safe-area-inset-bottom, 0px) + 12.5rem))",
        zIndex: 100,
      }}
    >
      <span className="relative grid h-[76px] w-[76px] shrink-0 place-items-center">
        <span className="absolute inset-1 rounded-[28px] bg-gradient-to-br from-rose-300 via-fuchsia-500 to-sky-400 opacity-70 blur-lg" />
        <span className="relative grid h-[68px] w-[68px] place-items-center rounded-[24px] border border-white/45 bg-white/15 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-xl transition-transform duration-200 group-active:scale-95">
          <span className="grid h-12 w-12 place-items-center rounded-[16px] bg-gradient-to-br from-[#fb7185] via-[#e11d48] to-[#6d28d9] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
            <Camera className="h-6 w-6 text-white" strokeWidth={2.15} />
          </span>
        </span>
      </span>
      <span className="inline-flex max-w-[7.5rem] shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-white/25 bg-black/55 px-2.5 py-1.5 text-[10px] font-semibold leading-none tracking-wide text-white shadow-[0_8px_18px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <Heart className="h-2.5 w-2.5 shrink-0 fill-rose-400 text-rose-300" strokeWidth={2.4} />
        Eu amo Guarapari
      </span>
    </button>
  );
}

function coverSource(srcW: number, srcH: number, dstRatio: number) {
  const srcRatio = srcW / srcH;
  if (srcRatio > dstRatio) {
    const sw = srcH * dstRatio;
    return { sx: (srcW - sw) / 2, sy: 0, sw, sh: srcH };
  }
  const sh = srcW / dstRatio;
  return { sx: 0, sy: (srcH - sh) / 2, sw: srcW, sh };
}

export function TouristCamera({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef(0);
  const frameRef = useRef<HTMLImageElement | null>(null);
  const fileRef = useRef<File | null>(null);
  const shotRef = useRef<string | null>(null);
  const [facing, setFacing] = useState<Facing>("user");
  const [torch, setTorch] = useState(false);
  const [phase, setPhase] = useState<"live" | "review">("live");
  const [shotUrl, setShotUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [saved, setSaved] = useState(false);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const openCamera = async (mode: Facing) => {
    const request = ++requestRef.current;
    stopStream();
    setError(null);
    setTorch(false);
    if (!window.isSecureContext) {
      setError("No celular a câmara só abre num endereço https.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (request !== requestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
    } catch {
      if (request === requestRef.current) {
        setError("A câmara não abriu. Permita o acesso nas definições do navegador e tente de novo.");
      }
    }
  };

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const image = new Image();
    image.onload = () => {
      frameRef.current = image;
    };
    image.src = FRAME_ASSET;
    void openCamera("user");
    return () => {
      requestRef.current += 1;
      document.body.style.overflow = previous;
      stopStream();
      if (shotRef.current) URL.revokeObjectURL(shotRef.current);
    };
  }, []);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torch;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] } as unknown as MediaTrackConstraints);
      setTorch(next);
    } catch {
      setNotice("Este aparelho não acendeu o flash.");
    }
  };

  const flip = () => {
    const next = facing === "user" ? "environment" : "user";
    setFacing(next);
    void openCamera(next);
  };

  const capture = async () => {
    const video = videoRef.current;
    const stage = stageRef.current;
    if (!video || !stage || !video.videoWidth) return;
    const box = stage.getBoundingClientRect();
    const ratio = box.width / box.height;
    const longSide = 1600;
    const canvasH = ratio > 1 ? Math.round(longSide / ratio) : longSide;
    const canvasW = Math.round(canvasH * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const crop = coverSource(video.videoWidth, video.videoHeight, ratio);
    ctx.save();
    if (facing === "user") {
      ctx.translate(canvasW, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, canvasW, canvasH);
    ctx.restore();
    const frame = frameRef.current;
    if (frame?.naturalWidth) {
      ctx.drawImage(frame, 0, 0, canvasW, canvasH);
    }
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) return;
    if (shotUrl) URL.revokeObjectURL(shotUrl);
    const url = URL.createObjectURL(blob);
    fileRef.current = new File([blob], "eu-amo-guarapari.jpg", { type: "image/jpeg" });
    shotRef.current = url;
    setShotUrl(url);
    setSaved(false);
    setNotice(null);
    setFlashOn(true);
    window.setTimeout(() => setFlashOn(false), 140);
    window.setTimeout(() => setPhase("review"), 120);
    navigator.vibrate?.(18);
  };

  const photoFile = () => {
    const source = fileRef.current;
    if (!source) return null;
    return new File([source], "eu-amo-guarapari.jpg", { type: "image/jpeg", lastModified: Date.now() });
  };

  const sharePhoto = async () => {
    const file = photoFile();
    if (!file || !navigator.share) return false;
    const payload = { files: [file] };
    if (navigator.canShare && !navigator.canShare(payload)) return false;
    await navigator.share(payload);
    return true;
  };

  const downloadPhoto = () => {
    if (!shotUrl) return;
    const link = document.createElement("a");
    link.href = shotUrl;
    link.download = "eu-amo-guarapari.jpg";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const save = async () => {
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (mobile) {
      try {
        if (await sharePhoto()) {
          setSaved(true);
          setNotice(null);
          return;
        }
      } catch (saveError) {
        if (saveError instanceof DOMException && saveError.name === "AbortError") return;
      }
    }
    downloadPhoto();
    setSaved(true);
  };

  const share = async () => {
    try {
      if (await sharePhoto()) {
        setNotice(null);
        return;
      }
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
    }
    setNotice("Este celular não abriu a foto para compartilhar.");
  };

  const retake = () => {
    if (shotUrl) URL.revokeObjectURL(shotUrl);
    shotRef.current = null;
    setShotUrl(null);
    fileRef.current = null;
    setPhase("live");
    setNotice(null);
    setSaved(false);
  };

  const live = (
    <div className="absolute inset-0 z-[80] bg-black">
      <div ref={stageRef} className="relative h-full w-full overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: facing === "user" ? "scaleX(-1)" : undefined }}
        />
        <img
          src={FRAME_ASSET}
          alt=""
          className="pointer-events-none absolute inset-0 z-40 h-full w-full object-fill"
        />
      </div>
      {flashOn && <div className="pointer-events-none absolute inset-0 z-40 bg-white/80" />}
      <button
        type="button"
        aria-label="Fechar câmera"
        onClick={onClose}
        className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-50 grid h-10 w-10 place-items-center rounded-full bg-black/35 text-white shadow-xl backdrop-blur-md"
      >
        <X className="h-4 w-4" />
      </button>
      {error && (
        <div className="absolute inset-x-6 top-1/3 z-50 rounded-3xl bg-black/60 p-5 text-center text-white shadow-xl backdrop-blur-md">
          <p className="font-serif text-2xl italic">A câmara ficou quieta</p>
          <p className="mt-2 text-sm text-white/75">{error}</p>
          <button
            type="button"
            onClick={() => void openCamera(facing)}
            className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#082f49]"
          >
            Tentar de novo
          </button>
        </div>
      )}
      {notice && phase === "live" && (
        <p className="absolute inset-x-6 top-16 z-50 text-center text-xs text-white drop-shadow">{notice}</p>
      )}
      <div className="absolute inset-x-0 bottom-8 z-50 flex items-center justify-center gap-10">
        <button
          type="button"
          aria-label={torch ? "Desligar flash" : "Ligar flash"}
          aria-pressed={torch}
          onClick={() => void toggleTorch()}
          className={`grid h-12 w-12 place-items-center rounded-full text-white shadow-xl ${torch ? "bg-amber-400 text-[#3a2208]" : "bg-black/35 backdrop-blur-md"}`}
        >
          <Zap className={`h-5 w-5 ${torch ? "fill-[#3a2208]" : ""}`} />
        </button>
        <button
          type="button"
          aria-label="Capturar foto"
          onClick={() => void capture()}
          disabled={Boolean(error)}
          className="grid h-[78px] w-[78px] place-items-center rounded-full border-[5px] border-white bg-transparent shadow-[0_8px_22px_rgba(0,0,0,0.45)] transition active:scale-95 disabled:opacity-40"
        >
          <span className="h-[58px] w-[58px] rounded-full bg-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.06)]" />
        </button>
        <button
          type="button"
          aria-label="Alternar câmera"
          onClick={flip}
          className="grid h-12 w-12 place-items-center rounded-full bg-black/35 text-white shadow-xl backdrop-blur-md"
        >
          <SwitchCamera className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const review = (
    <div className="absolute inset-0 z-[80] flex flex-col bg-sky-800 text-white">
      <header className="flex items-center justify-between px-4 pb-2 pt-[max(0.8rem,env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label="Fechar câmera"
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Check className="h-4 w-4 text-emerald-300" />
          Foto capturada!
        </p>
        <span className="h-10 w-10" />
      </header>
      <div className="min-h-0 flex-1 px-3">
        {shotUrl && (
          <img
            src={shotUrl}
            alt="Foto com a moldura Eu amo Guarapari"
            className="h-full w-full object-contain"
          />
        )}
      </div>
      <footer className="space-y-2.5 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={() => void save()}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#22c55e] text-base font-semibold text-white shadow-xl shadow-emerald-950/30"
        >
          <Download className="h-5 w-5" />
          {saved ? "Foto salva" : "Salvar na Galeria"}
        </button>
        <button
          type="button"
          onClick={() => void share()}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563eb] text-base font-semibold text-white shadow-xl shadow-blue-950/30"
        >
          <Share2 className="h-5 w-5" />
          Compartilhar
        </button>
        {notice && <p className="text-center text-xs text-white/70">{notice}</p>}
        <button type="button" onClick={retake} className="w-full py-1 text-center text-sm text-white/70">
          ← Tirar outra foto
        </button>
      </footer>
    </div>
  );

  return createPortal(phase === "review" ? review : live, document.body);
}
