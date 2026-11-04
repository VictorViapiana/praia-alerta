import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  formatDistance,
  formatWalk,
  modeLabel,
  type TravelMode,
  type WalkRoute,
} from "../../data/walk-route";
import { speakGuara, stopSpeaking } from "../../utils/speech";

type Props = {
  mode: TravelMode;
  route: WalkRoute;
  stepIndex: number;
  remainingMeters: number;
  onStop: () => void;
  onNextStep: () => void;
};

export function NavHud({ mode, route, stepIndex, remainingMeters, onStop, onNextStep }: Props) {
  const insets = useSafeAreaInsets();
  const step = route.steps[stepIndex] ?? route.steps[route.steps.length - 1];

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
      <View style={styles.card}>
        <Text style={styles.mode}>
          {modeLabel(mode)} · {formatDistance(remainingMeters)} · {formatWalk(route.seconds)}
        </Text>
        <Text style={styles.instruction}>{step?.instruction || step?.text || "Siga a linha no mapa"}</Text>
        {step?.street ? <Text style={styles.street}>{step.street}</Text> : null}
        <View style={styles.row}>
          <Pressable
            style={styles.listen}
            onPress={() => speakGuara(step?.speech || step?.instruction || "Siga a rota")}
          >
            <Text style={styles.listenText}>Ouvir</Text>
          </Pressable>
          <Pressable style={styles.next} onPress={onNextStep}>
            <Text style={styles.nextText}>Próximo</Text>
          </Pressable>
          <Pressable
            style={styles.stop}
            onPress={() => {
              stopSpeaking();
              onStop();
            }}
          >
            <Text style={styles.stopText}>Parar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 12, right: 12, top: 0, zIndex: 60 },
  card: {
    backgroundColor: "rgba(15,23,42,0.92)",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 4,
  },
  mode: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  instruction: { color: "#fff", fontSize: 17, fontWeight: "800", lineHeight: 22 },
  street: { color: "#7dd3fc", fontSize: 13 },
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  listen: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  listenText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  next: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#0284c7",
  },
  nextText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  stop: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(239,68,68,0.9)",
  },
  stopText: { color: "#fff", fontWeight: "800", fontSize: 12 },
});
