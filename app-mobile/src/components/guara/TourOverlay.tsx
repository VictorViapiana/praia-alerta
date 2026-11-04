import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TourStep } from "../../data/onboarding";
import { GuaraPose } from "./GuaraPose";
import { speakGuara, stopSpeaking } from "../../utils/speech";

type Props = {
  steps: TourStep[];
  index: number;
  onNext: () => void;
  onDone: () => void;
};

/** Avisos do Guará — balão branco, Ouvir, dots e botão vermelho como no web. */
export function TourOverlay({ steps, index, onNext, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const step = steps[index] ?? steps[0];
  const last = index >= steps.length - 1;
  const [narrating, setNarrating] = useState(false);

  useEffect(() => {
    if (!step) return;
    setNarrating(true);
    speakGuara(step.text, () => setNarrating(false));
    return () => {
      stopSpeaking();
      setNarrating(false);
    };
  }, [index, step]);

  if (!step) return null;

  const advance = () => {
    stopSpeaking();
    setNarrating(false);
    if (last) onDone();
    else onNext();
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 18, paddingTop: insets.top + 12 }]}>
      <Pressable style={styles.dim} onPress={advance} accessibilityLabel="Avançar aviso" />
      <View style={styles.coach} pointerEvents="box-none">
        <View style={styles.guaraWrap} pointerEvents="none">
          <GuaraPose pose={step.guara === "large" ? "festa" : "avisos"} size={step.guara === "large" ? 92 : 72} />
        </View>
        <Text style={styles.text}>{step.text}</Text>
        <View style={styles.footer}>
          <Pressable
            hitSlop={8}
            onPress={() => {
              if (narrating) {
                stopSpeaking();
                setNarrating(false);
                return;
              }
              setNarrating(true);
              speakGuara(step.text, () => setNarrating(false));
            }}
          >
            <Text style={styles.listenText}>{narrating ? "Pausar" : "Ouvir"}</Text>
          </Pressable>
          <View style={styles.dots} pointerEvents="none">
            {steps.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotOn]} />
            ))}
          </View>
          <Pressable style={styles.next} onPress={advance}>
            <Text style={styles.nextText}>{last ? "Começar a usar" : "Próximo >>"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    justifyContent: "flex-end",
    paddingHorizontal: 14,
  },
  dim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.72)" },
  coach: {
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
    zIndex: 2,
  },
  guaraWrap: { alignItems: "center", marginTop: -36 },
  text: { color: "#1c120c", fontSize: 14, lineHeight: 20, fontWeight: "500" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  listenText: { color: "#e11d48", fontSize: 11, fontWeight: "700", paddingVertical: 4, paddingHorizontal: 2 },
  dots: { flexDirection: "row", gap: 5, flex: 1, justifyContent: "center" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(15,23,42,0.18)" },
  dotOn: { backgroundColor: "#e11d48", width: 14 },
  next: {
    backgroundColor: "#e11d48",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  nextText: { color: "#fff", fontSize: 12, fontWeight: "800" },
});
