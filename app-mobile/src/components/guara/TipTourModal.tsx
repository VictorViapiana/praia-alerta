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

  const tone =
    step.kind === "alerta"
      ? styles.toneAlert
      : step.kind === "convivencia"
        ? styles.toneGood
        : styles.toneInfo;

  const btn =
    accent === "teal"
      ? "#0f766e"
      : accent === "amber"
        ? "#d97706"
        : accent === "rose"
          ? "#e11d48"
          : "#1d4ed8";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={() => {
          stopSpeaking();
          if (last) onClose();
          else onNext();
        }}
      >
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <GuaraPose pose="avisos" size={56} />
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
            </View>
            <Text style={styles.badge}>
              {stepIndex + 1}/{steps.length}
            </Text>
          </View>
          <View style={[styles.bubble, tone]}>
            <Text style={styles.bubbleTitle}>{step.title}</Text>
            <Text style={styles.bubbleText}>{step.text}</Text>
          </View>
          <View style={styles.row}>
            <Pressable
              style={styles.listen}
              onPress={() => speakGuara(`${step.title}. ${step.text}`)}
            >
              <Volume2 size={16} color="#0f172a" />
              <Text style={styles.listenText}>Ouvir</Text>
            </Pressable>
            <Pressable
              style={[styles.next, { backgroundColor: btn }]}
              onPress={() => {
                stopSpeaking();
                if (last) onClose();
                else onNext();
              }}
            >
              <Text style={styles.nextText}>{last ? "Pronto" : "Próxima"}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    gap: 10,
    alignItems: "center",
  },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 8, width: "100%" },
  title: { color: "#0c2a4a", fontSize: 17, fontWeight: "800" },
  sub: { color: "#64748b", fontSize: 12, marginTop: 2 },
  badge: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
  },
  bubble: { width: "100%", borderRadius: 16, borderWidth: 1, padding: 12, gap: 4 },
  toneAlert: { backgroundColor: "#fff1f2", borderColor: "#fecdd3" },
  toneGood: { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" },
  toneInfo: { backgroundColor: "#f0f9ff", borderColor: "#bae6fd" },
  bubbleTitle: { fontWeight: "800", fontSize: 14, color: "#0f172a" },
  bubbleText: { fontSize: 13, lineHeight: 19, color: "#334155" },
  row: { flexDirection: "row", gap: 8, width: "100%", marginTop: 4 },
  listen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
  },
  listenText: { fontWeight: "700", color: "#0f172a", fontSize: 13 },
  next: { flex: 1, borderRadius: 999, alignItems: "center", paddingVertical: 12 },
  nextText: { color: "#fff", fontWeight: "800" },
});
