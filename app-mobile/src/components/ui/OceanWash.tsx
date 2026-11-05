import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { SkyPhase } from "../../data/sky-phase";

/** Céu contínuo da orla — mesmas faixas do web (`globals.css` data-sky). */
const SKY: Record<
  SkyPhase,
  { colors: [string, string, string, string, string]; locations: [number, number, number, number, number] }
> = {
  dawn: {
    colors: ["#f7c9a8", "#f0a882", "#e08968", "#d06a52", "#c9785a"],
    locations: [0, 0.22, 0.48, 0.72, 1],
  },
  day: {
    colors: ["#b7daf2", "#7eb8e0", "#4f97cb", "#2f78b4", "#1d649c"],
    locations: [0, 0.24, 0.52, 0.74, 1], // = --pa-sky-fill day
  },
  dusk: {
    colors: ["#f2b48a", "#e8906e", "#c96a62", "#9a4a58", "#8a3d4a"],
    locations: [0, 0.2, 0.48, 0.74, 1],
  },
  night: {
    colors: ["#1a3a5c", "#123050", "#0c243e", "#091c32", "#071828"],
    locations: [0, 0.28, 0.55, 0.78, 1],
  },
};

type Props = {
  phase: SkyPhase;
  urgent?: boolean;
};

export function OceanWash({ phase, urgent = false }: Props) {
  const sky = SKY[phase] ?? SKY.day;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={sky.colors} locations={sky.locations} style={StyleSheet.absoluteFill} />
      {/* brilho quente no horizonte, como --pa-horizon-warm */}
      <LinearGradient
        colors={
          phase === "night"
            ? ["transparent", "rgba(120,160,210,0.12)", "transparent"]
            : phase === "dawn" || phase === "dusk"
              ? ["transparent", "rgba(255,180,120,0.28)", "transparent"]
              : ["transparent", "rgba(255,250,230,0.16)", "transparent"]
        }
        style={styles.horizon}
      />
      {urgent ? <View style={styles.urgent} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  horizon: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "42%",
    height: "28%",
  },
  urgent: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(127,29,29,0.35)",
  },
});
