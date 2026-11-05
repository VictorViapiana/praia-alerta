import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

/** Paridade web `GuaraShowerRitual`. */
export function ShowerRitualModal({ visible, name, stepIndex, onNext, onClose }: Props) {
  const insets = useSafeAreaInsets();
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

  const tone =
    step.kind === "moeda"
      ? styles.toneCoin
      : step.kind === "alerta"
        ? styles.toneAlert
        : step.kind === "festa"
          ? styles.toneFesta
          : styles.toneGood;

  const pose =
    last || step.kind === "festa"
      ? "festa"
      : step.kind === "moeda"
        ? "mare"
        : step.kind === "alerta"
          ? "avisos"
          : "clima";

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 16) }]}
        onPress={() => {
          stopSpeaking();
          if (last) onClose();
          else onNext();
        }}
      >
        <Pressable
          style={[styles.close, { top: insets.top + 8 }]}
          onPress={(e) => {
            e.stopPropagation?.();
            stopSpeaking();
            onClose();
          }}
          accessibilityLabel="Fechar"
        >
          <X color="#fff" size={18} strokeWidth={2.2} />
        </Pressable>

        <View style={styles.stage} pointerEvents="box-none">
          {step.kind === "moeda" ? (
            <View style={styles.coin}>
              <Text style={styles.coinTop}>Brasil</Text>
              <Text style={styles.coinValue}>R$ 1</Text>
            </View>
          ) : (
            <View style={styles.coinSpacer} />
          )}

          <Text style={styles.name}>{name}</Text>
          <Text style={styles.guaraTag}>Guará</Text>

          <Pressable style={[styles.bubble, tone]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.bubbleHead}>
              <Text style={styles.kind}>{label}</Text>
              <Text style={styles.badge}>
                {stepIndex + 1}/{steps.length}
              </Text>
            </View>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.body}>{step.text}</Text>
            <View style={styles.row}>
              <Pressable
                style={styles.listen}
                onPress={() => speakGuara(last ? SHOWER_SPEAK : `${step.title}. ${step.text}`)}
              >
                <Volume2 color="#0b3a5b" size={14} />
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
                <Text style={styles.nextText}>{last ? "Entendi, Guará" : "Próximo >>"}</Text>
              </Pressable>
            </View>
          </Pressable>

          <View style={styles.bars}>
            {steps.map((_, i) => (
              <View key={i} style={[styles.bar, i <= stepIndex && styles.barOn]} />
            ))}
          </View>

          <GuaraPose pose={pose} size={180} style={styles.guara} />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0c4a6e",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  close: {
    position: "absolute",
    right: 12,
    zIndex: 30,
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  stage: { width: "100%", maxWidth: 352, alignItems: "center" },
  coin: {
    width: 92,
    height: 92,
    borderRadius: 999,
    backgroundColor: "#f5d76e",
    borderWidth: 3,
    borderColor: "#fff7d1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  coinSpacer: { height: 20 },
  coinTop: {
    color: "#5c4308",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  coinValue: { color: "#5c4308", fontSize: 28, fontWeight: "900" },
  name: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  guaraTag: {
    marginTop: 4,
    color: "rgba(224,242,254,0.75)",
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: "uppercase",
  },
  bubble: {
    marginTop: 12,
    width: "100%",
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  toneCoin: { backgroundColor: "#fff8e7", borderColor: "rgba(253,230,138,0.8)" },
  toneAlert: { backgroundColor: "#fff1f2", borderColor: "rgba(254,205,211,0.8)" },
  toneFesta: { backgroundColor: "#ecfeff", borderColor: "rgba(165,243,252,0.8)" },
  toneGood: { backgroundColor: "#ecfdf5", borderColor: "rgba(167,243,208,0.8)" },
  bubbleHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kind: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    opacity: 0.7,
    color: "#0f172a",
  },
  badge: {
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: "700",
    color: "#0f172a",
    overflow: "hidden",
  },
  title: { marginTop: 8, color: "#0f172a", fontSize: 18, fontWeight: "700" },
  body: { marginTop: 6, color: "rgba(15,23,42,0.9)", fontSize: 14, lineHeight: 20 },
  row: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  listen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  listenText: { fontWeight: "700", color: "#0b3a5b", fontSize: 13 },
  next: {
    borderRadius: 999,
    backgroundColor: "#0284c7",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  nextText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  bars: { marginTop: 10, width: "100%", flexDirection: "row", gap: 6, paddingHorizontal: 4 },
  bar: { flex: 1, height: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.2)" },
  barOn: { backgroundColor: "#a5f3fc" },
  guara: { marginTop: 8, width: 180, height: 190, resizeMode: "contain" },
});
