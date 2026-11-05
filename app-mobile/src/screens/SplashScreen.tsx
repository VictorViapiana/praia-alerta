import { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = { onDone: () => void };

const DONE_MS = 3200;
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const H = Dimensions.get("window").height;
/** Guará mais baixo que o sol — evita o disco solar atravessar o olho (webp com transparência). */
const STAGE_DROP = H * 0.16;

/**
 * Splash igual ao web (`app/splash.tsx` + `.sx-stage`).
 * Sol atrás/acima; Guará na frente com backing opaco.
 */
export function SplashScreen({ onDone }: Props) {
  const fadeOut = useRef(new Animated.Value(1)).current;
  const birdOpacity = useRef(new Animated.Value(0)).current;
  const birdY = useRef(new Animated.Value(36)).current;
  const birdScale = useRef(new Animated.Value(0.92)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandY = useRef(new Animated.Value(14)).current;
  const sunPulse = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(birdOpacity, { toValue: 1, duration: 1050, delay: 120, easing: EASE, useNativeDriver: true }),
      Animated.timing(birdY, { toValue: 0, duration: 1050, delay: 120, easing: EASE, useNativeDriver: true }),
      Animated.timing(birdScale, { toValue: 1, duration: 1050, delay: 120, easing: EASE, useNativeDriver: true }),
      Animated.timing(brandOpacity, { toValue: 1, duration: 900, delay: 550, easing: EASE, useNativeDriver: true }),
      Animated.timing(brandY, { toValue: 0, duration: 900, delay: 550, easing: EASE, useNativeDriver: true }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(sunPulse, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(sunPulse, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    pulse.start();

    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -8, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    float.start();

    const fadeTimer = setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 700,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    }, DONE_MS - 700);

    const doneTimer = setTimeout(onDone, DONE_MS);
    return () => {
      pulse.stop();
      float.stop();
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [birdOpacity, birdScale, birdY, brandOpacity, brandY, fadeOut, floatY, onDone, sunPulse]);

  const sunScale = sunPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const sunOpacity = sunPulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });

  return (
    <Animated.View style={[styles.fill, { opacity: fadeOut }]} pointerEvents="none">
      {/* Fundo opaco sólido — no fade não vaza o sol da home pelo olho do Guará */}
      <View style={styles.opaqueBase} />
      <LinearGradient
        colors={["#67c8f5", "#93d8f8", "#c4e8fb", "#f5e6b8", "#7dd3fc", "#0ea5e9"]}
        locations={[0, 0.22, 0.38, 0.55, 0.74, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.wash} pointerEvents="none" />

      <Animated.View style={[styles.sunWrap, { opacity: sunOpacity, transform: [{ scale: sunScale }] }]}>
        <View style={styles.sunHalo} />
        <View style={styles.sunCorona} />
        <LinearGradient
          colors={["#ffffff", "#fffbeb", "#fef08a", "#fbbf24", "#f59e0b", "#ea580c"]}
          style={styles.sun}
        />
      </Animated.View>

      <LinearGradient
        colors={["transparent", "rgba(14,116,160,0.28)", "rgba(18,100,155,0.72)", "#1d649c"]}
        locations={[0, 0.35, 0.72, 1]}
        style={styles.sea}
      />

      <View style={[styles.stage, { transform: [{ translateY: STAGE_DROP }] }]}>
        <Animated.View
          style={{
            opacity: birdOpacity,
            transform: [{ translateY: Animated.add(birdY, floatY) }, { scale: birdScale }],
            alignItems: "center",
          }}
        >
          {/* Disco opaco atrás do Guará — tapa qualquer vazamento do sol pelo webp */}
          <View style={styles.birdBack} />
          <Image
            source={require("../assets/guara/poses/chapeu-alegretto.webp")}
            style={styles.bird}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.brand,
            { opacity: brandOpacity, transform: [{ translateY: brandY }] },
          ]}
        >
          <Text style={styles.name}>Praia Alerta Guará</Text>
          <Text style={styles.tag}>Praia do Morro</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
    zIndex: 200,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7eb8e0",
  },
  opaqueBase: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#7eb8e0",
  },
  wash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255,250,235,0.18)",
  },
  sunWrap: {
    position: "absolute",
    top: "12%",
    left: "50%",
    width: 160,
    height: 160,
    marginLeft: -80,
    marginTop: -80,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
  },
  sunHalo: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 999,
    backgroundColor: "rgba(253,224,71,0.22)",
  },
  sunCorona: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: "rgba(254,240,138,0.45)",
  },
  sun: {
    width: 88,
    height: 88,
    borderRadius: 999,
  },
  sea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "34%",
    zIndex: 1,
  },
  stage: {
    zIndex: 2,
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 6,
  },
  birdBack: {
    position: "absolute",
    top: "8%",
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: "rgba(196,232,251,0.95)",
  },
  bird: {
    width: 210,
    aspectRatio: 621 / 975,
    zIndex: 1,
  },
  brand: {
    alignItems: "center",
    marginTop: 6,
    gap: 2,
  },
  name: {
    color: "#0c4a6e",
    fontSize: 26,
    fontWeight: "600",
    letterSpacing: -0.4,
    textShadowColor: "rgba(255,255,255,0.35)",
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 1 },
  },
  tag: {
    marginTop: 4,
    color: "rgba(12,74,110,0.72)",
    fontSize: 12.5,
    fontWeight: "500",
    letterSpacing: 2.8,
    textTransform: "uppercase",
  },
});
