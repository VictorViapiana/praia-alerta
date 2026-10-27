"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Send, Volume2, X } from "lucide-react";
import { useState } from "react";
import { useTide, useWeather } from "./coast";
import { MAP_PROMPTS, answerGuara, type GuaraGuide } from "./guara-guide";
import { speakGuara, stopSpeaking } from "./voice";

type Line = { role: "user" | "guara"; text: string };

export function GuaraMapChat({
  hidden,
  onGuide,
}: {
  hidden: boolean;
  onGuide: (guide: GuaraGuide) => void;
}) {
  const { data: tide } = useTide();
  const { data: weather } = useWeather();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { role: "guara", text: "Diz o que você quer ver. Eu movo o mapa e abro o lugar." },
  ]);

  const ask = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    const guide = answerGuara(clean, { tide, weather });
    const next: Line[] = [...lines, { role: "user", text: clean }, { role: "guara", text: guide.answer }];
    setLines(next.slice(-8));
    setDraft("");
    onGuide(guide);
  };

  if (hidden && !open) return null;

  return (
    <>
      {!open && !hidden && (
        <button
          type="button"
          data-map-ui
          onClick={() => setOpen(true)}
          aria-label="Falar com o Guará"
          className="absolute bottom-[9.75rem] left-4 z-50 flex items-center gap-1.5 rounded-full border border-white/30 bg-black/55 py-1 pl-1 pr-3 text-white shadow-[0_12px_28px_rgba(0,0,0,0.35)] backdrop-blur-md"
        >
          <img src="/guara.png?v=3" alt="" className="h-8 w-auto" draggable={false} />
          <span className="text-[11px] font-semibold">Guará</span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.section
            data-map-ui
            role="dialog"
            aria-label="Conversar com o Guará"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="absolute inset-x-3 bottom-3 z-[58] flex max-h-[68%] flex-col overflow-hidden rounded-[28px] border border-white/20 bg-[#102028]/92 text-white shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
              <img src="/guara.png?v=3" alt="" className="h-9 w-auto" draggable={false} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-none">Guará</p>
                <p className="mt-1 text-[11px] text-white/60">Eu levo o mapa até o que você pedir</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setOpen(false);
                }}
                aria-label="Fechar conversa"
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
              {lines.map((line, index) => (
                <div
                  key={`${line.role}-${index}`}
                  className={
                    line.role === "user"
                      ? "ml-8 rounded-2xl rounded-br-md bg-white/12 px-3 py-2 text-[13px] leading-snug"
                      : "mr-6 rounded-2xl rounded-bl-md bg-[#e11d48]/90 px-3 py-2 text-[13px] leading-snug"
                  }
                >
                  <p>{line.text}</p>
                  {line.role === "guara" && (
                    <button
                      type="button"
                      onClick={() => speakGuara(line.text)}
                      className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-black/15 px-2 py-0.5 text-[10px] font-semibold"
                    >
                      <Volume2 className="h-3 w-3" />
                      Ouvir
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-3 pb-2">
              {MAP_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => ask(prompt.ask)}
                  className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium"
                >
                  {prompt.emoji} {prompt.label}
                </button>
              ))}
            </div>

            <form
              className="flex items-center gap-2 border-t border-white/10 px-3 py-2.5"
              onSubmit={(event) => {
                event.preventDefault();
                ask(draft);
              }}
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Quiosque 12, ducha, escuna…"
                aria-label="Perguntar ao Guará"
                className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-white/40"
              />
              <button
                type="submit"
                aria-label="Enviar"
                className="grid h-8 w-8 place-items-center rounded-full bg-[#e11d48] text-white"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
