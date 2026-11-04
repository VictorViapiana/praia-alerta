import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { GuaraPose } from "../components/guara/GuaraPose";
import { useApp } from "../context/AppContext";
import type { RootStackParamList } from "../navigation/types";
import { pulseEmergency, pulseSoft } from "../utils/haptics";

type Props = NativeStackScreenProps<RootStackParamList, "Crianca">;
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
const LOCAIS = ["Calçadão", "Areia", "Perto da água", "Quiosque", "Posto de salva-vidas", "Não sei"];
const PARENTES = ["Mãe", "Pai", "Avó ou avô", "Tio ou tia", "Outro"];
const ESTADOS = ["Tranquila", "Assustada", "Chorando", "Machucada"];
const CORES = ["Vermelha", "Azul", "Amarela", "Verde", "Branca", "Preta", "Rosa", "Estampada"];

function digits(v: string) {
  return v.replace(/\D/g, "");
}
function maskCpf(v: string) {
  const d = digits(v).slice(0, 11);
  return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function maskPhone(v: string) {
  const d = digits(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

function Chip({
  label,
  on,
  onPress,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

export function CriancaScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { sky } = useApp();
  const [path, setPath] = useState<Path>("perdi");
  const [step, setStep] = useState<Step>("escolha");
  const [report, setReport] = useState<Report>(EMPTY);
  const [protocol, setProtocol] = useState("");
  const [gap, setGap] = useState<string | null>(null);

  const set = (key: keyof Report, value: string) => setReport((r) => ({ ...r, [key]: value }));

  const childOk = useMemo(() => {
    if (!report.idade || !report.apresenta || !report.camisa || !report.local) return false;
    if (path === "achei" && !report.estado) return false;
    return true;
  }, [report, path]);

  const adultOk = useMemo(() => {
    if (report.nome.trim().length < 3) return false;
    if (path === "perdi" && !report.parentesco) return false;
    if (digits(report.telefone).length < 10) return false;
    if (digits(report.cpf).length !== 11) return false;
    return true;
  }, [report, path]);

  const next = () => {
    void pulseSoft();
    setGap(null);
    if (step === "escolha") {
      setStep("crianca");
      return;
    }
    if (step === "crianca") {
      if (!childOk) {
        setGap("Complete idade, apresentação, camisa e local.");
        return;
      }
      setStep("responsavel");
      return;
    }
    if (step === "responsavel") {
      if (!adultOk) {
        setGap("Nome, telefone com DDD e CPF (11 dígitos) são obrigatórios.");
        return;
      }
      setStep("revisao");
      return;
    }
    if (step === "revisao") {
      void pulseEmergency();
      setProtocol(`CM-${String(Date.now()).slice(-6)}`);
      setStep("enviado");
    }
  };

  return (
    <LinearGradient colors={[sky.themeColor, "#082038"]} style={styles.fill}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 16,
          gap: 12,
        }}
      >
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Voltar</Text>
        </Pressable>
        <View style={styles.hero}>
          <GuaraPose pose="crianca" size={84} />
          <Text style={styles.title}>Criança Perdida</Text>
          <Text style={styles.sub}>Alerta para quiosques e guarda-vidas da orla.</Text>
        </View>

        {step === "escolha" && (
          <View style={styles.tabs}>
            {(["perdi", "achei"] as Path[]).map((id) => (
              <Pressable
                key={id}
                style={[styles.tab, path === id && styles.tabOn]}
                onPress={() => {
                  void pulseSoft();
                  setPath(id);
                }}
              >
                <Text style={[styles.tabText, path === id && styles.tabTextOn]}>
                  {id === "perdi" ? "Perdi uma criança" : "Achei uma criança"}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {step === "crianca" && (
          <View style={styles.block}>
            <Text style={styles.label}>Idade</Text>
            <View style={styles.wrap}>{IDADES.map((x) => <Chip key={x} label={x} on={report.idade === x} onPress={() => set("idade", x)} />)}</View>
            <Text style={styles.label}>Apresentação</Text>
            <View style={styles.wrap}>{APRESENTA.map((x) => <Chip key={x} label={x} on={report.apresenta === x} onPress={() => set("apresenta", x)} />)}</View>
            <Text style={styles.label}>Camisa</Text>
            <View style={styles.wrap}>{CORES.map((x) => <Chip key={x} label={x} on={report.camisa === x} onPress={() => set("camisa", x)} />)}</View>
            <Text style={styles.label}>Cabelo</Text>
            <View style={styles.wrap}>{CABELOS.map((x) => <Chip key={x} label={x} on={report.cabelo === x} onPress={() => set("cabelo", x)} />)}</View>
            <Text style={styles.label}>Local</Text>
            <View style={styles.wrap}>{LOCAIS.map((x) => <Chip key={x} label={x} on={report.local === x} onPress={() => set("local", x)} />)}</View>
            {path === "achei" && (
              <>
                <Text style={styles.label}>Estado agora</Text>
                <View style={styles.wrap}>{ESTADOS.map((x) => <Chip key={x} label={x} on={report.estado === x} onPress={() => set("estado", x)} />)}</View>
              </>
            )}
            <TextInput style={styles.input} placeholder="Nome ou apelido (opcional)" placeholderTextColor="rgba(255,255,255,0.35)" value={report.nomeCrianca} onChangeText={(v) => set("nomeCrianca", v)} />
            <TextInput style={[styles.input, { minHeight: 72 }]} multiline placeholder="Detalhe (boné, mochila…)" placeholderTextColor="rgba(255,255,255,0.35)" value={report.detalhe} onChangeText={(v) => set("detalhe", v)} />
          </View>
        )}

        {step === "responsavel" && (
          <View style={styles.block}>
            <TextInput style={styles.input} placeholder="Seu nome completo" placeholderTextColor="rgba(255,255,255,0.35)" value={report.nome} onChangeText={(v) => set("nome", v)} />
            {path === "perdi" && (
              <>
                <Text style={styles.label}>Parentesco</Text>
                <View style={styles.wrap}>{PARENTES.map((x) => <Chip key={x} label={x} on={report.parentesco === x} onPress={() => set("parentesco", x)} />)}</View>
              </>
            )}
            <TextInput style={styles.input} placeholder="Telefone com DDD" placeholderTextColor="rgba(255,255,255,0.35)" keyboardType="phone-pad" value={report.telefone} onChangeText={(v) => set("telefone", maskPhone(v))} />
            <TextInput style={styles.input} placeholder="CPF" placeholderTextColor="rgba(255,255,255,0.35)" keyboardType="number-pad" value={report.cpf} onChangeText={(v) => set("cpf", maskCpf(v))} />
            <Text style={styles.label}>Segundo contato (opcional)</Text>
            <TextInput style={styles.input} placeholder="Nome de outro responsável" placeholderTextColor="rgba(255,255,255,0.35)" value={report.outroNome} onChangeText={(v) => set("outroNome", v)} />
            <TextInput style={styles.input} placeholder="Telefone do segundo contato" placeholderTextColor="rgba(255,255,255,0.35)" keyboardType="phone-pad" value={report.outroTelefone} onChangeText={(v) => set("outroTelefone", maskPhone(v))} />
            <TextInput style={styles.input} placeholder="Quem citou / apontou (opcional)" placeholderTextColor="rgba(255,255,255,0.35)" value={report.citado} onChangeText={(v) => set("citado", v)} />
          </View>
        )}

        {step === "revisao" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Revisão do alerta</Text>
            <Text style={styles.line}>{path === "perdi" ? "Perdi" : "Achei"} · {report.apresenta} · {report.idade}</Text>
            <Text style={styles.line}>Camisa {report.camisa} · {report.cabelo || "cabelo n/i"}</Text>
            <Text style={styles.line}>{path === "perdi" ? "Visto" : "Encontrada"}: {report.local}</Text>
            {report.nomeCrianca ? <Text style={styles.line}>Nome: {report.nomeCrianca}</Text> : null}
            <Text style={styles.line}>Responsável: {report.nome} · {report.telefone}</Text>
            {report.outroNome ? (
              <Text style={styles.line}>
                2º contato: {report.outroNome} · {report.outroTelefone || "sem fone"}
              </Text>
            ) : null}
            {report.citado ? <Text style={styles.line}>Citado por: {report.citado}</Text> : null}
          </View>
        )}

        {step === "enviado" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Alerta registrado</Text>
            <Text style={styles.protocol}>{protocol}</Text>
            <Text style={styles.line}>
              Fique visível. A orla e o Guará foram notificados (protocolo local — integração com posto na Fase 2.2).
            </Text>
          </View>
        )}

        {gap ? <Text style={styles.gap}>{gap}</Text> : null}

        {step !== "enviado" ? (
          <Pressable style={styles.send} onPress={next}>
            <Text style={styles.sendText}>
              {step === "revisao" ? "Prosseguir com Alerta" : step === "escolha" ? "Continuar" : "Próximo"}
            </Text>
          </Pressable>
        ) : (
          <Pressable style={styles.send} onPress={() => navigation.goBack()}>
            <Text style={styles.sendText}>Voltar à home</Text>
          </Pressable>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  back: { color: "#fff", fontWeight: "700", fontSize: 16 },
  hero: { alignItems: "center", gap: 6 },
  title: { color: "#fff", fontSize: 26, fontWeight: "800" },
  sub: { color: "rgba(255,255,255,0.7)", textAlign: "center" },
  tabs: { flexDirection: "row", gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(15,23,42,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  tabOn: { backgroundColor: "rgba(251,146,60,0.9)", borderColor: "rgba(255,255,255,0.35)" },
  tabText: { color: "rgba(255,255,255,0.8)", fontWeight: "700", fontSize: 12, textAlign: "center" },
  tabTextOn: { color: "#0f172a" },
  block: { gap: 8 },
  label: { color: "rgba(255,255,255,0.65)", fontWeight: "700", fontSize: 12, marginTop: 6 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  chipOn: { backgroundColor: "#fb923c", borderColor: "#fdba74" },
  chipText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  chipTextOn: { color: "#0f172a" },
  input: {
    backgroundColor: "rgba(15,23,42,0.4)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginTop: 4,
  },
  card: {
    backgroundColor: "rgba(15,23,42,0.45)",
    borderRadius: 20,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  cardTitle: { color: "#fff", fontWeight: "800", fontSize: 18 },
  protocol: { color: "#fb923c", fontWeight: "900", fontSize: 22, letterSpacing: 1 },
  line: { color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 20 },
  gap: { color: "#fecaca", fontWeight: "600" },
  send: {
    marginTop: 4,
    backgroundColor: "#fb923c",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  sendText: { color: "#0f172a", fontWeight: "800" },
});
