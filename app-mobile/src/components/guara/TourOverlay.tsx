import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
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

type Hole = { top: number; left: number; width: number; height: number; radius: number };

/** Posições aproximadas dos alvos do tutorial (paridade spotlight do web). */
function holeForTarget(
  target: string | null,
  w: number,
  h: number,
  insets: { top: number; bottom: number },
): Hole | null {
  if (!target) return null;
  switch (target) {
    case "crianca":
      return { top: insets.top + 8, left: w - 72, width: 56, height: 56, radius: 18 };
    case "sos":
      return {
        top: h - insets.bottom - 118,
        left: 18,
        width: w - 36,
        height: 64,
        radius: 999,
      };
    case "map-search":
      return { top: insets.top + 56, left: 14, width: w - 88, height: 48, radius: 16 };
    case "map-filters":
      return { top: insets.top + 112, left: 14, width: w - 28, height: 44, radius: 14 };
    case "map-camera":
      return { top: h - insets.bottom - 240, left: w - 108, width: 92, height: 110, radius: 28 };
    case "map-location":
      return { top: insets.top + 56, left: w - 70, width: 48, height: 48, radius: 999 };
    default:
      return null;
  }
}

/** Avisos do Guará — balão + spotlight no alvo (como `guara-onboarding` no web). */
export function TourOverlay({ steps, index, onNext, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const { width: w, height: h } = useWindowDimensions();
  const step = steps[index] ?? steps[0];
  const last = index >= steps.length - 1;
  const [narrating, setNarrating] = useState(false);
  const large = step?.guara === "large" && !step?.target;
  const hole = holeForTarget(step?.target ?? null, w, h, insets);

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

  const bubbleNearHole =
    hole &&
    (hole.top > h * 0.45
      ? { top: Math.max(insets.top + 12, hole.top - 170), left: 18, right: 18 }
      : { top: Math.min(h - 220, hole.top + hole.height + 16), left: 18, right: 18 });

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 16, paddingTop: insets.top + 12 }]}>
      <Pressable style={styles.dim} onPress={advance} accessibilityLabel="Avançar aviso" />

      {hole ? (
        <View
          pointerEvents="none"
          style={[
            styles.hole,
            {
              top: hole.top,
              left: hole.left,
              width: hole.width,
              height: hole.height,
              borderRadius: hole.radius,
            },
          ]}
        />
      ) : null}

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
      ) : hole && bubbleNearHole ? (
        <View style={[styles.anchored, bubbleNearHole]} pointerEvents="box-none">
          <View style={styles.sideRow}>
            <GuaraPose pose="bust" size={48} />
            <View style={{ flex: 1 }}>{bubble}</View>
          </View>
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
  hole: {
    position: "absolute",
    zIndex: 1,
    borderWidth: 2.5,
    borderColor: "rgba(251,113,133,0.95)",
    backgroundColor: "rgba(255,255,255,0.08)",
    shadowColor: "#fb7185",
    shadowOpacity: 0.7,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  anchored: {
    position: "absolute",
    zIndex: 2,
  },
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
