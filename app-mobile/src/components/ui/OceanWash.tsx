import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { SkyPhase } from "../../data/sky-phase";

/**
 * Céu da home — paridade com web `SkyAtmosphere` + `--pa-sky-fill` (globals.css).
 * Sol no canto direito (~78%/12%), haze, horizonte, costa com máscara suave.
 */
const SKY: Record<
  SkyPhase,
  {
    colors: [string, string, string, string, string];
    locations: [number, number, number, number, number];
    bottom: string;
    sunGlow: string;
    sunX: `${number}%`;
    sunY: `${number}%`;
  }
> = {
  dawn: {
    colors: ["#f7c9a8", "#f0a882", "#e08968", "#d06a52", "#c9785a"],
    locations: [0, 0.22, 0.48, 0.72, 1],
    bottom: "#c9785a",
    sunGlow: "rgba(255,200,140,0.55)",
    sunX: "82%",
    sunY: "28%",
  },
  day: {
    colors: ["#b7daf2", "#7eb8e0", "#4f97cb", "#2f78b4", "#1d649c"],
    locations: [0, 0.24, 0.52, 0.74, 1],
    bottom: "#1d649c",
    sunGlow: "rgba(255,248,230,0.42)",
    sunX: "78%",
    sunY: "12%",
  },
  dusk: {
    colors: ["#f2b48a", "#e8906e", "#c96a62", "#9a4a58", "#8a3d4a"],
    locations: [0, 0.2, 0.48, 0.74, 1],
    bottom: "#8a3d4a",
    sunGlow: "rgba(255,160,100,0.5)",
    sunX: "18%",
    sunY: "32%",
  },
  night: {
    colors: ["#1a3a5c", "#123050", "#0c243e", "#091c32", "#071828"],
    locations: [0, 0.28, 0.55, 0.78, 1],
    bottom: "#071828",
    sunGlow: "rgba(200,220,255,0.18)",
    sunX: "72%",
    sunY: "16%",
  },
};

type Props = { phase: SkyPhase; urgent?: boolean };

function Cloud({
  top,
  left,
  scale = 1,
  soft,
}: {
  top: `${number}%`;
  left: `${number}%`;
  scale?: number;
  soft?: boolean;
}) {
  return (
    <View
      pointerEvents="none"
      style={[styles.cloud, soft && styles.cloudSoft, { top, left, transform: [{ scale }] }]}
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

      {/* brilho radial do sol — como sky-base do web */}
      <View
        style={[
          styles.sunRadial,
          {
            top: sky.sunY,
            left: sky.sunX,
            backgroundColor: sky.sunGlow,
            marginLeft: -90,
            marginTop: -90,
          },
        ]}
      />

      {/* haze */}
      <LinearGradient
        colors={["rgba(255,255,255,0.18)", "transparent"]}
        start={{ x: 0.1, y: 0.2 }}
        end={{ x: 0.55, y: 0.7 }}
        style={styles.hazeA}
      />
      <LinearGradient
        colors={["rgba(255,250,235,0.16)", "transparent"]}
        start={{ x: 0.9, y: 0.1 }}
        end={{ x: 0.4, y: 0.55 }}
        style={styles.hazeB}
      />

      {/* horizonte */}
      <LinearGradient
        colors={
          night
            ? ["transparent", "rgba(140,180,220,0.12)", "transparent"]
            : warm
              ? ["transparent", "rgba(255,180,120,0.28)", "rgba(125,211,252,0.1)"]
              : ["transparent", "rgba(186,230,253,0.1)", "rgba(255,250,230,0.18)", "rgba(125,211,252,0.12)"]
        }
        style={styles.horizon}
      />

      {!night ? (
        <View
          style={[
            styles.sunWrap,
            {
              top: sky.sunY,
              left: sky.sunX,
              marginLeft: -75,
              marginTop: -75,
            },
            urgent && styles.sunUrgent,
          ]}
        >
          <View style={styles.sunRays} />
          <View style={styles.sunBeamA} />
          <View style={styles.sunBeamB} />
          <View style={styles.sunGlow} />
          <LinearGradient
            colors={
              warm
                ? ["#ffffff", "#ffe0b0", "#ffb070"]
                : ["#ffffff", "#fff8eb", "#ffe8b0", "#f6d077"]
            }
            style={styles.sunCore}
          />
        </View>
      ) : (
        <View
          style={[
            styles.moonWrap,
            { top: sky.sunY, left: sky.sunX, marginLeft: -44, marginTop: -44 },
          ]}
        >
          <View style={styles.moonGlow} />
          <View style={styles.moonCore} />
        </View>
      )}

      {!night ? (
        <>
          <Cloud soft top="6%" left="2%" scale={0.7} />
          <Cloud soft top="10%" left="58%" scale={0.65} />
          <Cloud soft top="16%" left="12%" scale={0.9} />
          <Cloud top="22%" left="42%" scale={1.15} />
          <Cloud soft top="14%" left="72%" scale={0.85} />
          <Cloud soft top="28%" left="8%" scale={0.95} />
        </>
      ) : null}

      {/* costa / mar — máscara suave como sky-coast */}
      <LinearGradient
        colors={
          night
            ? ["transparent", "rgba(7,24,40,0.35)", "rgba(7,24,40,0.82)"]
            : warm
              ? ["transparent", "rgba(180,90,60,0.22)", "rgba(138,61,74,0.72)"]
              : ["transparent", "rgba(12,70,118,0.28)", "rgba(18,80,130,0.78)"]
        }
        style={styles.coast}
      />
      <LinearGradient
        colors={["transparent", "rgba(186,230,253,0.18)", "rgba(255,250,235,0.12)"]}
        style={styles.coastMist}
      />
      <View style={[styles.foam, night && { opacity: 0.18 }]} />
      <View style={[styles.sand, warm && { backgroundColor: "rgba(251,191,36,0.16)" }]} />

      {urgent ? <View style={styles.urgent} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sunRadial: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    opacity: 0.9,
  },
  hazeA: {
    position: "absolute",
    left: 0,
    top: "8%",
    width: "70%",
    height: "40%",
  },
  hazeB: {
    position: "absolute",
    right: 0,
    top: "4%",
    width: "55%",
    height: "36%",
  },
  horizon: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "28%",
    height: "22%",
  },
  sunWrap: {
    position: "absolute",
    width: 150,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  sunUrgent: { opacity: 0.85 },
  sunRays: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  sunBeamA: {
    position: "absolute",
    width: 18,
    height: 200,
    borderRadius: 999,
    backgroundColor: "rgba(255,251,235,0.22)",
    transform: [{ rotate: "-28deg" }],
  },
  sunBeamB: {
    position: "absolute",
    width: 12,
    height: 170,
    borderRadius: 999,
    backgroundColor: "rgba(255,251,235,0.18)",
    transform: [{ rotate: "12deg" }],
  },
  sunGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(255,252,240,0.55)",
  },
  sunCore: {
    width: 52,
    height: 52,
    borderRadius: 999,
  },
  moonWrap: {
    position: "absolute",
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  moonGlow: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: "rgba(220,230,255,0.22)",
  },
  moonCore: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#e8f0ff",
  },
  cloud: {
    position: "absolute",
    width: 130,
    height: 42,
    opacity: 0.68,
  },
  cloudSoft: { opacity: 0.38 },
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
    height: "58%",
  },
  coastMist: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "38%",
    height: "22%",
  },
  foam: {
    position: "absolute",
    left: "8%",
    right: "8%",
    bottom: "36%",
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  sand: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "7%",
    backgroundColor: "rgba(245,230,200,0.1)",
  },
  urgent: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(127,29,29,0.32)",
  },
});
