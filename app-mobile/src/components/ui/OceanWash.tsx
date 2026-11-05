import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { SkyPhase } from "../../data/sky-phase";

/**
 * Céu da home — paridade visual forte com `SkyAtmosphere` + `--pa-sky-fill` do web.
 * Gradiente saturado + sol grande + nuvens + faixa de costa.
 */
const SKY: Record<
  SkyPhase,
  {
    colors: [string, string, string, string, string, string];
    locations: [number, number, number, number, number, number];
    bottom: string;
  }
> = {
  dawn: {
    colors: ["#f7c9a8", "#f0a882", "#e08968", "#d06a52", "#c9785a", "#b45a3c"],
    locations: [0, 0.18, 0.38, 0.58, 0.78, 1],
    bottom: "#c9785a",
  },
  day: {
    colors: ["#c5e4f7", "#8fc4e8", "#5aa3d4", "#3b86c0", "#246ea8", "#1d649c"],
    locations: [0, 0.18, 0.4, 0.6, 0.8, 1],
    bottom: "#1d649c",
  },
  dusk: {
    colors: ["#f2b48a", "#e8906e", "#d66a5a", "#c96a62", "#9a4a58", "#8a3d4a"],
    locations: [0, 0.16, 0.36, 0.55, 0.78, 1],
    bottom: "#8a3d4a",
  },
  night: {
    colors: ["#1a3a5c", "#123050", "#0e2a48", "#0c243e", "#091c32", "#071828"],
    locations: [0, 0.22, 0.45, 0.65, 0.85, 1],
    bottom: "#071828",
  },
};

type Props = { phase: SkyPhase; urgent?: boolean };

function Cloud({ top, left, scale = 1, soft }: { top: `${number}%`; left: `${number}%`; scale?: number; soft?: boolean }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.cloud,
        soft && styles.cloudSoft,
        { top, left, transform: [{ scale }] },
      ]}
    >
      <View style={[styles.puff, { left: 0, top: 12, width: 58, height: 24 }]} />
      <View style={[styles.puff, { left: 28, top: 0, width: 64, height: 34 }]} />
      <View style={[styles.puff, { left: 68, top: 10, width: 50, height: 26 }]} />
      <View style={[styles.puff, { left: 48, top: 18, width: 44, height: 20 }]} />
    </View>
  );
}

export function OceanWash({ phase, urgent = false }: Props) {
  const sky = SKY[phase] ?? SKY.day;
  const night = phase === "night";
  const warm = phase === "dawn" || phase === "dusk";

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: sky.bottom }]} pointerEvents="none">
      <LinearGradient colors={sky.colors} locations={sky.locations} style={StyleSheet.absoluteFill} />

      {/* brilho de horizonte */}
      <LinearGradient
        colors={
          night
            ? ["transparent", "rgba(140,180,220,0.14)", "transparent"]
            : warm
              ? ["transparent", "rgba(255,200,140,0.42)", "transparent"]
              : ["transparent", "rgba(255,252,235,0.28)", "transparent"]
        }
        style={styles.horizon}
      />

      {!night ? (
        <View style={[styles.sunWrap, warm && styles.sunWarm]}>
          <View style={styles.sunRays} />
          <View style={styles.sunBeamA} />
          <View style={styles.sunBeamB} />
          <View style={styles.sunGlow} />
          <LinearGradient
            colors={warm ? ["#fff7ed", "#fdba74", "#ea580c"] : ["#ffffff", "#fef08a", "#fbbf24", "#f59e0b"]}
            style={styles.sunCore}
          />
        </View>
      ) : (
        <View style={styles.moonWrap}>
          <View style={styles.moonGlow} />
          <View style={styles.moonCore} />
        </View>
      )}

      {!night ? (
        <>
          <Cloud soft top="8%" left="4%" scale={0.75} />
          <Cloud soft top="14%" left="62%" scale={0.7} />
          <Cloud top="20%" left="16%" scale={1} />
          <Cloud top="26%" left="48%" scale={1.2} />
          <Cloud soft top="18%" left="74%" scale={0.9} />
          <Cloud soft top="32%" left="6%" scale={0.95} />
        </>
      ) : null}

      {/* costa / mar */}
      <LinearGradient
        colors={
          night
            ? ["transparent", "rgba(7,24,40,0.45)", "rgba(7,24,40,0.85)"]
            : warm
              ? ["transparent", "rgba(180,90,60,0.28)", "rgba(138,61,74,0.7)"]
              : ["transparent", "rgba(29,100,156,0.35)", "rgba(18,80,130,0.78)"]
        }
        style={styles.coast}
      />
      <View style={[styles.foam, night && { opacity: 0.2 }]} />
      <View style={[styles.sand, warm && { backgroundColor: "rgba(251,191,36,0.18)" }]} />

      {urgent ? <View style={styles.urgent} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  horizon: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "38%",
    height: "32%",
  },
  sunWrap: {
    position: "absolute",
    top: "10%",
    left: "38%",
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  sunWarm: { top: "16%", left: "32%" },
  sunRays: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(254,240,138,0.22)",
  },
  sunBeamA: {
    position: "absolute",
    width: 14,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(255,250,220,0.18)",
    transform: [{ rotate: "18deg" }],
  },
  sunBeamB: {
    position: "absolute",
    width: 10,
    height: 140,
    borderRadius: 999,
    backgroundColor: "rgba(255,250,220,0.14)",
    transform: [{ rotate: "-28deg" }],
  },
  sunGlow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: "rgba(253,224,71,0.4)",
  },
  sunCore: {
    width: 64,
    height: 64,
    borderRadius: 999,
  },
  moonWrap: {
    position: "absolute",
    top: "10%",
    left: "60%",
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  moonGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: "rgba(186,230,253,0.2)",
  },
  moonCore: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
  },
  cloud: {
    position: "absolute",
    width: 130,
    height: 42,
    opacity: 0.7,
  },
  cloudSoft: { opacity: 0.4 },
  puff: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 999,
  },
  coast: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "42%",
  },
  foam: {
    position: "absolute",
    left: "6%",
    right: "6%",
    bottom: "38%",
    height: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.65)",
  },
  sand: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "8%",
    backgroundColor: "rgba(245,230,200,0.12)",
  },
  urgent: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(127,29,29,0.35)",
  },
});
