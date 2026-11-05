import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Volume2 } from "lucide-react-native";
import { GuaraPose } from "./GuaraPose";
import { speakGuara, stopSpeaking } from "../../utils/speech";

export type GuaraTipStep = {
  title: string;
  text: string;
  kind?: "alerta" | "convivencia" | "aviso";
};

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  steps: readonly GuaraTipStep[];
  stepIndex: number;
  accent?: "ocean" | "teal" | "amber" | "rose";
  onNext: () => void;
  onClose: () => void;
};

/** Paridade web `GuaraTipTour`: card + Guará + Ouvir/Próximo (botões fora do Pressable de fundo). */
export function TipTourModal({
  visible,
  title,
  subtitle,
  steps,
  stepIndex,
  accent = "ocean",
  onNext,
  onClose,
}: Props) {
  const step = steps[stepIndex] ?? steps[0];
  const last = stepIndex >= steps.length - 1;
  if (!step) return null;

  const btn =
    accent === "teal" ? "#0f766e" : accent === "amber" ? "#d97706" : accent === "rose" ? "#e11d48" : "#1d4ed8";
  const softBg =
    accent === "teal"
      ? "rgba(15,118,110,0.12)"
      : accent === "amber"
        ? "rgba(217,119,6,0.12)"
        : accent === "rose"
          ? "rgba(225,29,72,0.12)"
          : "rgba(29,78,216,0.12)";
  const softBorder =
    accent === "teal"
      ? "rgba(15,118,110,0.28)"
      : accent === "amber"
        ? "rgba(217,119,6,0.28)"
        : accent === "rose"
          ? "rgba(225,29,72,0.28)"
          : "rgba(29,78,216,0.28)";
  const softText =
    accent === "teal" ? "#0f766e" : accent === "amber" ? "#92400e" : accent === "rose" ? "#be123c" : "#1d4ed8";

  const tone =
    step.kind === "alerta"
      ? styles.toneAlert
      : step.kind === "convivencia"
        ? styles.toneGood
        : styles.toneInfo;

  const advance = () => {
    stopSpeaking();
    if (last) onClose();
    else onNext();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Fundo separado — não engole toques dos botões */}
        <Pressable style={StyleSheet.absoluteFill} onPress={advance} accessibilityLabel="Avançar aviso" />

        <View style={styles.stage} pointerEvents="box-none">
          <View style={styles.card} pointerEvents="auto">
            <View style={styles.head}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
              </View>
              <Text style={styles.badge}>
                {stepIndex + 1}/{steps.length}
              </Text>
            </View>

            <View style={[styles.bubble, tone]}>
              {step.kind === "alerta" ? <Text style={styles.kindAlert}>Alerta</Text> : null}
              {step.kind === "convivencia" ? <Text style={styles.kindGood}>Boa convivência</Text> : null}
              <Text style={styles.bubbleTitle}>{step.title}</Text>
              <Text style={styles.bubbleText}>{step.text}</Text>
            </View>

            <View style={styles.bars}>
              {steps.map((item, index) => (
                <View
                  key={`${item.title}-${index}`}
                  style={[styles.bar, { backgroundColor: index <= stepIndex ? btn : "rgba(0,0,0,0.1)" }]}
                />
              ))}
            </View>

            <View style={styles.row} pointerEvents="box-none">
              <Pressable
                style={[styles.listen, { backgroundColor: softBg, borderColor: softBorder }]}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  speakGuara(`${step.title}. ${step.text}`);
                }}
                hitSlop={12}
              >
                <Volume2 size={14} color={softText} />
                <Text style={[styles.listenText, { color: softText }]}>Ouvir</Text>
              </Pressable>
              <Pressable
                style={[styles.next, { backgroundColor: btn }]}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  advance();
                }}
                hitSlop={12}
              >
                <Text style={styles.nextText}>{last ? "Entendi, Guará" : "Próximo >>"}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.guaraSlot} pointerEvents="none">
            <GuaraPose pose={last ? "festa" : "full"} size={168} style={styles.guaraImg} />
          </View>
          <Text style={styles.hint} pointerEvents="none">
            Toque na tela ou em Próximo
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  stage: {
    width: "100%",
    maxWidth: 312,
    alignItems: "center",
    zIndex: 2,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
    zIndex: 2,
  },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  title: { color: "#0c2a4a", fontSize: 16, fontWeight: "800", lineHeight: 20 },
  sub: { color: "#737373", fontSize: 12, marginTop: 2 },
  badge: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: "700",
    color: "#737373",
    overflow: "hidden",
  },
  bubble: { marginTop: 10, borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  toneAlert: { backgroundColor: "rgba(254,242,242,0.95)", borderColor: "#fecdd3" },
  toneGood: { backgroundColor: "rgba(236,253,245,0.95)", borderColor: "#a7f3d0" },
  toneInfo: { backgroundColor: "rgba(240,249,255,0.95)", borderColor: "#bae6fd" },
  kindAlert: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(220,38,38,0.9)",
    marginBottom: 4,
  },
  kindGood: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(4,120,87,0.9)",
    marginBottom: 4,
  },
  bubbleTitle: { fontWeight: "700", fontSize: 13, color: "#1c120c", lineHeight: 18 },
  bubbleText: { marginTop: 4, fontSize: 13, lineHeight: 18, color: "#404040" },
  bars: { marginTop: 12, flexDirection: "row", gap: 6 },
  bar: { flex: 1, height: 4, borderRadius: 999 },
  row: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  listen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  listenText: { fontWeight: "700", fontSize: 13 },
  next: { borderRadius: 999, alignItems: "center", paddingHorizontal: 12, paddingVertical: 8 },
  nextText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  guaraSlot: {
    marginTop: -4,
    height: 168,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: 1,
  },
  guaraImg: {
    width: 168,
    height: 168,
    resizeMode: "contain",
  },
  hint: {
    marginTop: 4,
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
