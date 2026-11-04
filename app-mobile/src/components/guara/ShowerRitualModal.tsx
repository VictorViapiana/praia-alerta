import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Volume2, X } from "lucide-react-native";
import { GuaraPose } from "./GuaraPose";
import { SHOWER_RITUAL_STEPS, SHOWER_SPEAK } from "../../data/places";
import { speakGuara, stopSpeaking } from "../../utils/speech";

type Props = {
  visible: boolean;
  name: string;
  stepIndex: number;
  onNext: () => void;
  onClose: () => void;
};

export function ShowerRitualModal({ visible, name, stepIndex, onNext, onClose }: Props) {
  const steps = SHOWER_RITUAL_STEPS;
  const step = steps[stepIndex] ?? steps[0];
  const last = stepIndex >= steps.length - 1;
  if (!step) return null;

  const label =
    step.kind === "moeda"
      ? "Como usar"
      : step.kind === "alerta"
        ? "Cuidado"
        : step.kind === "festa"
          ? "Pronto"
          : "Boa convivência";

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.close}
          onPress={() => {
            stopSpeaking();
            onClose();
          }}
        >
          <X color="#fff" size={22} />
        </Pressable>
        <GuaraPose pose={step.kind === "festa" ? "festa" : "avisos"} size={88} />
        <Text style={styles.eyebrow}>{name}</Text>
        <Text style={styles.label}>{label}</Text>
        {step.kind === "moeda" ? (
          <View style={styles.coin}>
            <Text style={styles.coinTop}>Brasil</Text>
            <Text style={styles.coinValue}>R$ 1</Text>
          </View>
        ) : null}
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.body}>{step.text}</Text>
        <View style={styles.row}>
          <Pressable style={styles.listen} onPress={() => speakGuara(last ? SHOWER_SPEAK : `${step.title}. ${step.text}`)}>
            <Volume2 color="#0f172a" size={16} />
            <Text style={styles.listenText}>Ouvir</Text>
          </Pressable>
          <Pressable
            style={styles.next}
            onPress={() => {
              stopSpeaking();
              if (last) onClose();
              else onNext();
            }}
          >
            <Text style={styles.nextText}>{last ? "Entendi" : "Próxima"}</Text>
          </Pressable>
        </View>
        <Text style={styles.progress}>
          {stepIndex + 1}/{steps.length}
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0c4a6e",
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  close: { position: "absolute", top: 54, right: 20, padding: 8 },
  eyebrow: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  label: { color: "#7dd3fc", fontWeight: "800", fontSize: 13 },
  coin: {
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: "#f5d76e",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 6,
    borderWidth: 3,
    borderColor: "#fff7d1",
  },
  coinTop: { fontSize: 10, fontWeight: "800", color: "#5c4308", letterSpacing: 2, textTransform: "uppercase" },
  coinValue: { fontSize: 28, fontWeight: "900", color: "#5c4308" },
  title: { color: "#fff", fontSize: 24, fontWeight: "800", textAlign: "center" },
  body: { color: "rgba(255,255,255,0.9)", fontSize: 15, lineHeight: 22, textAlign: "center", maxWidth: 320 },
  row: { flexDirection: "row", gap: 10, marginTop: 12, width: "100%", maxWidth: 320 },
  listen: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  listenText: { fontWeight: "700", color: "#0f172a" },
  next: {
    flex: 1,
    backgroundColor: "#38bdf8",
    borderRadius: 999,
    alignItems: "center",
    paddingVertical: 12,
  },
  nextText: { fontWeight: "800", color: "#0f172a" },
  progress: { color: "rgba(255,255,255,0.55)", marginTop: 8, fontWeight: "700" },
});
