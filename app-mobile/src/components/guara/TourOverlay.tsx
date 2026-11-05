import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
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

/** Avisos do Guará — layout do web: balão branco + rabo + Guará embaixo (ou ao lado). */
export function TourOverlay({ steps, index, onNext, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const step = steps[index] ?? steps[0];
  const last = index >= steps.length - 1;
  const [narrating, setNarrating] = useState(false);
  const large = step?.guara === "large" && !step?.target;

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

  const toggleSpeak = () => {
    if (narrating) {
      stopSpeaking();
      setNarrating(false);
      return;
    }
    setNarrating(true);
    speakGuara(step.text, () => setNarrating(false));
  };

  const bubble = (
    <View style={styles.bubble}>
      <View style={[styles.tail, large ? styles.tailDown : styles.tailLeft]} />
      <Text style={styles.text}>{step.text}</Text>
      <View style={styles.footer}>
        <View style={styles.listenRow}>
          <Pressable hitSlop={8} onPress={toggleSpeak}>
            <Text style={styles.listenText}>{narrating ? "Pausar" : "Ouvir"}</Text>
          </Pressable>
          <View style={styles.dots} pointerEvents="none">
            {steps.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotOn]} />
            ))}
          </View>
        </View>
        <Pressable style={styles.next} onPress={advance}>
          <Text style={styles.nextText}>{last ? "Começar a usar" : "Próximo >>"}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 16, paddingTop: insets.top + 12 }]}>
      <Pressable style={styles.dim} onPress={advance} accessibilityLabel="Avançar aviso" />
      {large ? (
        <View style={styles.centerStack} pointerEvents="box-none">
          {bubble}
          <Image
            source={require("../../assets/guara/guara-inteiro.png")}
            style={styles.fullBird}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>
      ) : (
        <View style={styles.sideRow} pointerEvents="box-none">
          <GuaraPose pose="bust" size={48} />
          <View style={{ flex: 1 }}>{bubble}</View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  dim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.72)" },
  centerStack: {
    zIndex: 2,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    alignSelf: "center",
  },
  sideRow: {
    zIndex: 2,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    width: "100%",
  },
  bubble: {
    position: "relative",
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  tail: {
    position: "absolute",
    width: 14,
    height: 14,
    backgroundColor: "#fff",
    transform: [{ rotate: "45deg" }],
  },
  tailDown: {
    bottom: -6,
    alignSelf: "center",
    left: "50%",
    marginLeft: -7,
  },
  tailLeft: {
    left: -6,
    bottom: 22,
  },
  text: { color: "#1c120c", fontSize: 14, lineHeight: 20, fontWeight: "500" },
  footer: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  listenRow: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  listenText: { color: "#e11d48", fontSize: 11, fontWeight: "700" },
  dots: { flexDirection: "row", gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(15,23,42,0.15)" },
  dotOn: { backgroundColor: "#e11d48", width: 16 },
  next: {
    backgroundColor: "#e11d48",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  nextText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  fullBird: {
    width: 220,
    height: 280,
    marginTop: 4,
  },
});
