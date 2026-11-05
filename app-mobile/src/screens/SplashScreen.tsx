import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = { onDone: () => void };

const DONE_MS = 3200;
const EASE = Easing.bezier(0.22, 1, 0.36, 1);

/**
 * Splash igual ao web (`app/splash.tsx`): horizonte, sol, Guará de chapéu Alegretto e marca.
 * Sem logo-splash / guara-inteiro — esses eram o visual antigo errado.
 */
export function SplashScreen({ onDone }: Props) {
  const fadeOut = useRef(new Animated.Value(1)).current;
  const birdOpacity = useRef(new Animated.Value(0)).current;
  const birdY = useRef(new Animated.Value(36)).current;
  const birdScale = useRef(new Animated.Value(0.92)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandY = useRef(new Animated.Value(14)).current;
  const sunPulse = useRef(new Animated.Value(0)).current;

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
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [birdOpacity, birdScale, birdY, brandOpacity, brandY, fadeOut, onDone, sunPulse]);

  const sunScale = sunPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const sunOpacity = sunPulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });

  return (
    <Animated.View style={[styles.fill, { opacity: fadeOut }]} pointerEvents="none">
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

      <View style={styles.stage}>
        <Animated.View
          style={{
            opacity: birdOpacity,
            transform: [{ translateY: birdY }, { scale: birdScale }],
            alignItems: "center",
          }}
        >
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
  },
  wash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255,250,235,0.18)",
  },
  sunWrap: {
    position: "absolute",
    top: "18%",
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
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
  },
  stage: {
    zIndex: 2,
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 48,
    gap: 8,
  },
  bird: {
    width: 210,
    height: 300,
  },
  brand: {
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  name: {
    color: "#0f2744",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.2,
    textShadowColor: "rgba(255,255,255,0.55)",
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 1 },
  },
  tag: {
    color: "rgba(15,39,68,0.72)",
    fontSize: 14,
    fontWeight: "600",
  },
});
