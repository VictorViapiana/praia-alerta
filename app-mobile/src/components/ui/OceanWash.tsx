import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { SkyPhase } from "../../data/sky-phase";

/** Céu contínuo da orla — faixas + sol + nuvens + costa (paridade `SkyAtmosphere` web). */
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
    locations: [0, 0.24, 0.52, 0.74, 1],
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

function Cloud({ style, soft }: { style: object; soft?: boolean }) {
  return (
    <View style={[styles.cloud, soft && styles.cloudSoft, style]} pointerEvents="none">
      <View style={[styles.cloudPuff, styles.cloudPuffA]} />
      <View style={[styles.cloudPuff, styles.cloudPuffB]} />
      <View style={[styles.cloudPuff, styles.cloudPuffC]} />
    </View>
  );
}

export function OceanWash({ phase, urgent = false }: Props) {
  const sky = SKY[phase] ?? SKY.day;
  const night = phase === "night";
  const warm = phase === "dawn" || phase === "dusk";

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={sky.colors} locations={sky.locations} style={StyleSheet.absoluteFill} />

      {/* haze + horizonte quente */}
      <LinearGradient
        colors={
          night
            ? ["transparent", "rgba(120,160,210,0.12)", "transparent"]
            : warm
              ? ["transparent", "rgba(255,180,120,0.28)", "transparent"]
              : ["transparent", "rgba(255,250,230,0.16)", "transparent"]
        }
        style={styles.horizon}
      />

      {/* Sol / luar */}
      {!night ? (
        <View style={[styles.sunWrap, warm && styles.sunWarm]}>
          <View style={styles.sunRays} />
          <View style={styles.sunGlow} />
          <LinearGradient
            colors={warm ? ["#fff7ed", "#fdba74", "#f97316"] : ["#ffffff", "#fef08a", "#fbbf24"]}
            style={styles.sunCore}
          />
        </View>
      ) : (
        <View style={styles.moonWrap}>
          <View style={styles.moonGlow} />
          <View style={styles.moonCore} />
        </View>
      )}

      {/* Nuvens suaves */}
      {!night ? (
        <>
          <Cloud soft style={styles.cloudFarA} />
          <Cloud soft style={styles.cloudFarB} />
          <Cloud soft style={styles.cloud1} />
          <Cloud style={styles.cloud2} />
          <Cloud soft style={styles.cloud3} />
          <Cloud soft style={styles.cloud4} />
        </>
      ) : null}

      {/* Costa / faixa do mar embaixo */}
      <LinearGradient
        colors={
          night
            ? ["transparent", "rgba(7,24,40,0.35)", "rgba(7,24,40,0.72)"]
            : warm
              ? ["transparent", "rgba(180,90,60,0.22)", "rgba(138,61,74,0.55)"]
              : ["transparent", "rgba(29,100,156,0.28)", "rgba(29,100,156,0.62)"]
        }
        style={styles.coast}
      />
      <View style={[styles.coastFoam, night && { opacity: 0.25 }]} />

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
  sunWrap: {
    position: "absolute",
    top: "14%",
    alignSelf: "center",
    left: "42%",
    width: 92,
    height: 92,
    alignItems: "center",
    justifyContent: "center",
  },
  sunWarm: { top: "18%", left: "38%" },
  sunRays: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(254,240,138,0.18)",
  },
  sunGlow: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: "rgba(253,224,71,0.35)",
  },
  sunCore: {
    width: 48,
    height: 48,
    borderRadius: 999,
  },
  moonWrap: {
    position: "absolute",
    top: "12%",
    left: "58%",
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  moonGlow: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 999,
    backgroundColor: "rgba(186,230,253,0.18)",
  },
  moonCore: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
  },
  cloud: {
    position: "absolute",
    width: 120,
    height: 36,
    opacity: 0.55,
  },
  cloudSoft: { opacity: 0.32 },
  cloudPuff: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
  },
  cloudPuffA: { left: 8, top: 10, width: 54, height: 22 },
  cloudPuffB: { left: 40, top: 2, width: 48, height: 28 },
  cloudPuffC: { left: 70, top: 12, width: 42, height: 20 },
  cloudFarA: { top: "10%", left: "6%", transform: [{ scale: 0.7 }] },
  cloudFarB: { top: "16%", left: "68%", transform: [{ scale: 0.65 }] },
  cloud1: { top: "22%", left: "18%" },
  cloud2: { top: "28%", left: "52%", transform: [{ scale: 1.15 }] },
  cloud3: { top: "20%", left: "72%", transform: [{ scale: 0.85 }] },
  cloud4: { top: "34%", left: "8%", transform: [{ scale: 0.9 }] },
  coast: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "38%",
  },
  coastFoam: {
    position: "absolute",
    left: "8%",
    right: "8%",
    bottom: "34%",
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  urgent: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(127,29,29,0.35)",
  },
});
