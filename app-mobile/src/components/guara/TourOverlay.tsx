import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TourStep } from "../../data/onboarding";
import { GuaraPose } from "./GuaraPose";
import { speakGuara, stopSpeaking } from "../../utils/speech";
import { useEffect } from "react";

type Props = {
  steps: TourStep[];
  index: number;
  onNext: () => void;
  onDone: () => void;
};

export function TourOverlay({ steps, index, onNext, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const step = steps[index] ?? steps[0];
  const last = index >= steps.length - 1;

  useEffect(() => {
    if (!step) return;
    speakGuara(step.text);
    return () => stopSpeaking();
  }, [index, step]);

  if (!step) return null;

  return (
    <Pressable
      style={[styles.root, { paddingBottom: insets.bottom + 20, paddingTop: insets.top + 16 }]}
      onPress={() => {
        stopSpeaking();
        if (last) onDone();
        else onNext();
      }}
    >
      <View style={styles.card}>
        <GuaraPose pose={step.guara === "large" ? "festa" : "avisos"} size={step.guara === "large" ? 96 : 64} />
        <Text style={styles.progress}>
          {index + 1}/{steps.length}
        </Text>
        <Text style={styles.text}>{step.text}</Text>
        <Text style={styles.hint}>{last ? "Toque para começar" : "Toque para continuar"}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  progress: { color: "#64748b", fontSize: 11, fontWeight: "700" },
  text: { color: "#0f172a", fontSize: 16, lineHeight: 24, textAlign: "center", fontWeight: "600" },
  hint: { color: "#94a3b8", fontSize: 12, marginTop: 4 },
});
