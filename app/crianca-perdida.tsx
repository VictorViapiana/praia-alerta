"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Baby, Check, ChevronRight, HeartHandshake, Search, X } from "lucide-react";
import { useState, type ReactNode } from "react";

type Path = "perdi" | "achei";
type Step = "escolha" | "crianca" | "responsavel" | "revisao" | "enviado";

type Report = {
  idade: string;
  apresenta: string;
  camisa: string;
  cabelo: string;
  local: string;
  nomeCrianca: string;
  detalhe: string;
  estado: string;
  nome: string;
  parentesco: string;
  cpf: string;
  telefone: string;
  outroNome: string;
  outroTelefone: string;
  citado: string;
};

const EMPTY: Report = {
  idade: "",
  apresenta: "",
  camisa: "",
  cabelo: "",
  local: "",
  nomeCrianca: "",
  detalhe: "",
  estado: "",
  nome: "",
  parentesco: "",
  cpf: "",
  telefone: "",
  outroNome: "",
  outroTelefone: "",
  citado: "",
};

const IDADES = ["Até 2", "3 a 5", "6 a 8", "9 a 12", "Não sei"];
const APRESENTA = ["Menino", "Menina", "Não sei"];
const CABELOS = ["Loiro", "Castanho", "Preto", "Ruivo", "Não sei"];
const LOCAIS = ["Calçadão", "Areia", "Perto da água", "Quiosque do Zé", "Posto de salva-vidas", "Não sei"];
const PARENTES = ["Mãe", "Pai", "Avó ou avô", "Tio ou tia", "Outro"];
const ESTADOS = ["Tranquila", "Assustada", "Chorando", "Machucada"];

const CORES: { id: string; swatch: string }[] = [
  { id: "Vermelha", swatch: "#ef4444" },
  { id: "Azul", swatch: "#3b82f6" },
  { id: "Amarela", swatch: "#facc15" },
  { id: "Verde", swatch: "#22c55e" },
  { id: "Branca", swatch: "#f8fafc" },
  { id: "Preta", swatch: "#27272a" },
  { id: "Rosa", swatch: "#f472b6" },
  { id: "Estampada", swatch: "conic-gradient(#f472b6, #facc15, #22d3ee, #f472b6)" },
];

const spring = { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.86 };

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function maskCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function childGap(path: Path, report: Report) {
  if (!report.idade) return "Escolha a idade, mesmo que seja Não sei.";
  if (!report.apresenta) return "Diga como a criança se apresenta.";
  if (!report.camisa) return "Marque a cor da camisa.";
  if (!report.local) return path === "perdi" ? "Diga onde ela foi vista por último." : "Diga onde você a encontrou.";
  if (path === "achei" && !report.estado) return "Como a criança está agora?";
  return null;
}

function adultGap(path: Path, report: Report) {
  if (report.nome.trim().length < 3) return "Falta o nome de quem está avisando.";
  if (path === "perdi" && !report.parentesco) return "Qual é o seu parentesco com a criança?";
  if (digits(report.telefone).length < 10) return "O telefone precisa ter DDD.";
  if (digits(report.cpf).length !== 11) return "O CPF do adulto precisa ter 11 números.";
  return null;
}

function childSummary(path: Path, report: Report) {
  const age =
    report.idade === "Não sei" ? "idade não informada" : report.idade ? `${report.idade} anos` : "";
  const hair =
    report.cabelo === "Não sei"
      ? "cabelo não informado"
      : report.cabelo
        ? `cabelo ${report.cabelo.toLowerCase()}`
        : "";
  const who = [report.apresenta, age, hair].filter(Boolean).join(" · ");
  const clothes = report.camisa ? `Camisa ${report.camisa.toLowerCase()}` : "";
  const place =
    path === "perdi" ? `Visto por último: ${report.local}` : `Encontrada: ${report.local}`;
  const lines = [who, clothes, place, report.estado && `Agora: ${report.estado.toLowerCase()}`, report.nomeCrianca && `Nome: ${report.nomeCrianca}`, report.detalhe].filter(
    Boolean,
  );
  return lines as string[];
}

function StepBody({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={spring}
      className="px-4 pb-4"
    >
      {children}
    </motion.div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
        selected ? "border-white bg-white text-[#2a120c]" : "border-white/20 bg-white/10 text-white/85",
      )}
    >
      {children}
    </button>
  );
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((option) => (
          <Chip key={option} selected={value === option} onClick={() => onChange(option)}>
            {option}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  hint?: string;
  inputMode?: "text" | "tel" | "numeric";
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">{label}</span>
      <input
        value={value}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 text-[15px] text-white outline-none placeholder:text-white/30 focus:border-white/55"
      />
      {hint ? <span className="mt-1 block text-[11px] leading-relaxed text-white/45">{hint}</span> : null}
    </label>
  );
}

export function CriancaModal({ onClose }: { onClose: () => void }) {
  const [path, setPath] = useState<Path | null>(null);
  const [step, setStep] = useState<Step>("escolha");
  const [report, setReport] = useState<Report>(EMPTY);
  const [protocol, setProtocol] = useState("");

  const set = <K extends keyof Report>(key: K, value: Report[K]) => {
    setReport((current) => ({ ...current, [key]: value }));
  };

  const choose = (next: Path) => {
    if (path && path !== next) setReport(EMPTY);
    setPath(next);
    setStep("crianca");
  };

  const back = () => {
    if (step === "crianca") setStep("escolha");
    if (step === "responsavel") setStep("crianca");
    if (step === "revisao") setStep("responsavel");
  };

  const lost = path !== "achei";
  const gap =
    step === "crianca" && path ? childGap(path, report) : step === "responsavel" && path ? adultGap(path, report) : null;

  const advance = () => {
    if (step === "crianca" && !gap) setStep("responsavel");
    if (step === "responsavel" && !gap) setStep("revisao");
    if (step === "revisao") {
      setProtocol(`CM-${String(Date.now()).slice(-4)}`);
      setStep("enviado");
    }
  };

  const stepIndex = step === "crianca" ? 0 : step === "responsavel" ? 1 : step === "revisao" ? 2 : -1;

  return (
    <motion.div
      role="dialog"
      aria-labelledby="crianca-titulo"
      className="absolute inset-0 z-[45] flex flex-col overflow-hidden bg-[#140806] text-white"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={spring}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            path === "achei"
              ? "radial-gradient(120% 55% at 50% -10%, rgba(45,212,191,0.28), transparent 58%)"
              : "radial-gradient(120% 55% at 50% -10%, rgba(251,146,60,0.34), transparent 58%)",
        }}
      />

      <header
        className="relative z-10 flex items-center gap-2 px-3 pb-2"
        style={{ paddingTop: "max(1rem, calc(env(safe-area-inset-top, 0px) + 0.35rem))" }}
      >
        {step === "escolha" || step === "enviado" ? (
          <span className="h-11 w-11" />
        ) : (
          <button
            type="button"
            aria-label="Voltar"
            onClick={back}
            className="relative grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 touch-manipulation before:absolute before:-inset-2 before:content-['']"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">
            Praia do Morro
          </p>
          {stepIndex >= 0 ? (
            <div className="mx-auto mt-1.5 flex w-28 gap-1" aria-hidden>
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className={cx("h-1 flex-1 rounded-full", index <= stepIndex ? "bg-white" : "bg-white/20")}
                />
              ))}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="relative grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 touch-manipulation before:absolute before:-inset-2 before:content-['']"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="no-scrollbar relative z-10 min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === "escolha" ? (
            <StepBody key="escolha">
              <div className="px-2 pt-3 text-center">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-orange-200/30 bg-orange-400/15 shadow-[0_0_32px_rgba(251,146,60,0.35)]">
                  <Baby className="h-7 w-7 text-orange-100" />
                </span>
                <h2 id="crianca-titulo" className="mt-4 font-serif text-[1.7rem] leading-none text-white">
                  Criança na praia
                </h2>
                <p className="mx-auto mt-3 max-w-[18rem] text-sm leading-relaxed text-white/75">
                  Para evitar trotes e acionar os Salva-Vidas, identifique-se.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() => choose("perdi")}
                  className="relative w-full overflow-hidden rounded-[1.5rem] border border-orange-200/30 bg-orange-400/15 p-4 text-left"
                >
                  <span className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-300/25 blur-2xl" />
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-300/20 text-orange-50">
                    <Search className="h-5 w-5" />
                  </span>
                  <span className="mt-3 flex items-center justify-between gap-3">
                    <span>
                      <span className="block text-lg font-semibold leading-tight">Perdi uma criança</span>
                      <span className="mt-1 block text-sm leading-relaxed text-white/70">
                        Descreva quem você procura. O posto recebe o alerta na hora.
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-white/70" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => choose("achei")}
                  className="relative w-full overflow-hidden rounded-[1.5rem] border border-teal-200/30 bg-teal-300/10 p-4 text-left"
                >
                  <span className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-teal-300/20 blur-2xl" />
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-300/15 text-teal-50">
                    <HeartHandshake className="h-5 w-5" />
                  </span>
                  <span className="mt-3 flex items-center justify-between gap-3">
                    <span>
                      <span className="block text-lg font-semibold leading-tight">Achei uma criança</span>
                      <span className="mt-1 block text-sm leading-relaxed text-white/70">
                        Fique com ela. Descreva o que você vê e deixe seu contato.
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-white/70" />
                  </span>
                </button>
              </div>
              <p className="mt-4 text-center text-[11px] text-white/40">O alerta vai direto ao posto da Praia do Morro.</p>
            </StepBody>
          ) : null}

          {step === "crianca" && path ? (
            <StepBody key="crianca">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">Passo 1 de 3 · A criança</p>
              <h2 id="crianca-titulo" className="mt-1 font-serif text-[1.65rem] leading-none">
                {lost ? "Quem você procura?" : "Como ela é agora?"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                {lost
                  ? "Se não souber algum detalhe, marque Não sei. O posto entende."
                  : "Conte só o que você está vendo. Não precisa adivinhar o nome."}
              </p>
              <div className="mt-4 space-y-4">
                <ChipGroup label="Idade aproximada" options={IDADES} value={report.idade} onChange={(value) => set("idade", value)} />
                <ChipGroup label="Aparência" options={APRESENTA} value={report.apresenta} onChange={(value) => set("apresenta", value)} />
                <fieldset>
                  <legend className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">Cor da camisa</legend>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {CORES.map((cor) => {
                      const selected = report.camisa === cor.id;
                      return (
                        <button
                          key={cor.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => set("camisa", cor.id)}
                          className={cx(
                            "flex flex-col items-center gap-1 rounded-2xl border px-1 py-2",
                            selected ? "border-white bg-white/15" : "border-white/10 bg-white/5",
                          )}
                        >
                          <span
                            className={cx("h-6 w-6 rounded-full border", cor.id === "Branca" ? "border-white/40" : "border-white/10")}
                            style={{ background: cor.swatch }}
                          />
                          <span className="text-[10px] text-white/80">{cor.id}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <ChipGroup label="Cabelo" options={CABELOS} value={report.cabelo} onChange={(value) => set("cabelo", value)} />
                <ChipGroup
                  label={lost ? "Visto por último" : "Onde você encontrou"}
                  options={LOCAIS}
                  value={report.local}
                  onChange={(value) => set("local", value)}
                />
                {path === "achei" ? (
                  <ChipGroup label="Como a criança está" options={ESTADOS} value={report.estado} onChange={(value) => set("estado", value)} />
                ) : null}
                <TextField
                  label="Nome da criança, se souber"
                  value={report.nomeCrianca}
                  onChange={(value) => set("nomeCrianca", value)}
                  placeholder="Pode deixar em branco"
                  autoComplete="off"
                />
                <label className="block">
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">
                    Algum detalhe a mais?
                  </span>
                  <textarea
                    value={report.detalhe}
                    rows={2}
                    placeholder="Boné, óculos, mochila, um brinquedo..."
                    onChange={(event) => set("detalhe", event.target.value)}
                    className="mt-1.5 w-full resize-none rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 text-[15px] text-white outline-none placeholder:text-white/30 focus:border-white/55"
                  />
                </label>
              </div>
            </StepBody>
          ) : null}

          {step === "responsavel" && path ? (
            <StepBody key="responsavel">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">Passo 2 de 3 · Responsáveis</p>
              <h2 id="crianca-titulo" className="mt-1 font-serif text-[1.65rem] leading-none">
                {lost ? "Quem responde por ela?" : "Seu contato"}
              </h2>
              <p className="mt-3 rounded-2xl border border-white/15 bg-white/10 px-3 py-3 text-sm leading-relaxed text-white/80">
                Para evitar trotes e acionar os Salva-Vidas, identifique-se.
              </p>
              <div className="mt-4 space-y-4">
                <TextField
                  label={lost ? "Nome do responsável" : "Seu nome"}
                  value={report.nome}
                  onChange={(value) => set("nome", value)}
                  placeholder="Nome completo"
                  autoComplete="name"
                />
                {lost ? (
                  <ChipGroup
                    label="Parentesco"
                    options={PARENTES}
                    value={report.parentesco}
                    onChange={(value) => set("parentesco", value)}
                  />
                ) : (
                  <p className="rounded-2xl border border-teal-200/25 bg-teal-300/10 px-3 py-3 text-sm text-teal-50">
                    Você entra no alerta como a pessoa que encontrou a criança.
                  </p>
                )}
                <TextField
                  label="Telefone"
                  value={report.telefone}
                  onChange={(value) => set("telefone", maskPhone(value))}
                  placeholder="(27) 99999-9999"
                  inputMode="tel"
                  autoComplete="tel"
                />
                <TextField
                  label="CPF do adulto"
                  value={report.cpf}
                  onChange={(value) => set("cpf", maskCpf(value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  hint="Só do adulto. A criança não precisa de documento."
                />
                {lost ? (
                  <>
                    <TextField
                      label="Outro responsável por perto"
                      value={report.outroNome}
                      onChange={(value) => set("outroNome", value)}
                      placeholder="Opcional"
                      hint="Alguém que também esteja na praia e possa atender."
                    />
                    {report.outroNome.trim() ? (
                      <TextField
                        label="Telefone desse responsável"
                        value={report.outroTelefone}
                        onChange={(value) => set("outroTelefone", maskPhone(value))}
                        placeholder="(27) 99999-9999"
                        inputMode="tel"
                      />
                    ) : null}
                  </>
                ) : (
                  <TextField
                    label="A criança citou alguém?"
                    value={report.citado}
                    onChange={(value) => set("citado", value)}
                    placeholder="Nome da mãe, do pai, de quem ela chamou"
                    hint="Opcional. Escreva só o que ela falou."
                  />
                )}
              </div>
            </StepBody>
          ) : null}

          {step === "revisao" && path ? (
            <StepBody key="revisao">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">Passo 3 de 3 · Revisão</p>
              <h2 id="crianca-titulo" className="mt-1 font-serif text-[1.65rem] leading-none">
                Confira antes de enviar
              </h2>
              <p className="mt-2 text-sm text-white/65">Os salva-vidas recebem exatamente isto.</p>
              <div className="mt-4 space-y-3">
                <article className="rounded-[1.4rem] border border-white/15 bg-white/10 p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">A criança</p>
                  <ul className="mt-2 space-y-1 text-sm leading-relaxed text-white">
                    {childSummary(path, report).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <button type="button" onClick={() => setStep("crianca")} className="mt-3 text-xs font-medium text-white/60 underline">
                    Corrigir descrição
                  </button>
                </article>
                <article className="rounded-[1.4rem] border border-white/15 bg-white/10 p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Responsáveis</p>
                  <p className="mt-2 text-sm leading-relaxed text-white">
                    {report.nome}
                    {report.parentesco ? ` · ${report.parentesco}` : " · quem encontrou"}
                  </p>
                  <p className="text-sm text-white/75">{report.telefone}</p>
                  <p className="text-sm text-white/75">CPF {report.cpf}</p>
                  {report.outroNome ? (
                    <p className="mt-2 text-sm text-white/80">
                      Também na praia: {report.outroNome}
                      {report.outroTelefone ? ` · ${report.outroTelefone}` : ""}
                    </p>
                  ) : null}
                  {report.citado ? <p className="mt-2 text-sm text-white/80">A criança citou: {report.citado}</p> : null}
                  <button type="button" onClick={() => setStep("responsavel")} className="mt-3 text-xs font-medium text-white/60 underline">
                    Corrigir contato
                  </button>
                </article>
              </div>
            </StepBody>
          ) : null}

          {step === "enviado" && path ? (
            <StepBody key="enviado">
              <div className="px-2 pt-8 text-center">
                <span
                  className={cx(
                    "mx-auto grid h-16 w-16 place-items-center rounded-full border",
                    lost ? "border-orange-200/40 bg-orange-400/20" : "border-teal-200/40 bg-teal-300/20",
                  )}
                >
                  <Check className="h-7 w-7" />
                </span>
                <h2 id="crianca-titulo" className="mt-4 font-serif text-[1.7rem] leading-none">
                  {lost ? "Alerta encaminhado" : "Aviso enviado"}
                </h2>
                <p className="mt-2 text-sm text-white/55">Protocolo {protocol} · Praia do Morro</p>
                <p className="mx-auto mt-4 max-w-[18rem] text-sm leading-relaxed text-white/80">
                  {lost
                    ? "Os salva-vidas já têm a descrição. Fique onde está e deixe o telefone livre."
                    : "Fique com a criança neste ponto. Não a entregue a outra pessoa. Espere o posto."}
                </p>
              </div>
              <ul className="mx-4 mt-5 space-y-2 text-sm text-white/75">
                <li className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3">
                  {lost ? "Se ela aparecer, avise o posto antes de ir embora." : "Se ela disser um nome, repita para o salva-vidas."}
                </li>
                <li className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3">
                  Postos 1, 2 e 4 estão em operação agora.
                </li>
              </ul>
            </StepBody>
          ) : null}
        </AnimatePresence>
      </div>

      {step !== "escolha" ? (
        <div className="relative z-10 border-t border-white/10 bg-[#140806]/85 px-4 py-3 backdrop-blur-md">
          {gap ? <p className="mb-2 text-center text-[12px] text-white/55">{gap}</p> : null}
          {step === "enviado" ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl bg-white py-3.5 text-sm font-semibold text-[#2a120c]"
            >
              Fechar
            </button>
          ) : (
            <button
              type="button"
              disabled={Boolean(gap)}
              onClick={advance}
              className={cx(
                "w-full rounded-2xl py-3.5 text-sm font-semibold shadow-[0_12px_28px_-16px_rgba(0,0,0,0.8)] disabled:opacity-40",
                lost
                  ? "bg-gradient-to-r from-orange-400 to-red-500 text-white"
                  : "bg-gradient-to-r from-teal-300 to-cyan-400 text-[#042028]",
              )}
            >
              {step === "revisao" ? "Prosseguir com Alerta" : "Continuar"}
            </button>
          )}
        </div>
      ) : null}
    </motion.div>
  );
}
