import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  /** Sweep band width in px. */
  bandWidth?: number;
  /** Travel distance in px (start → end). */
  travel?: number;
  durationMs?: number;
  delayMs?: number;
  colors?: readonly [string, string, string];
  style?: StyleProp<ViewStyle>;
};

/** Brilho atravessando CTAs / cards ouro — paridade web shimmer / `.sheen`. */
export function ShineSweep({
  bandWidth = 96,
  travel = 280,
  durationMs = 1800,
  delayMs = 600,
  colors = ["transparent", "rgba(255,255,255,0.7)", "transparent"] as const,
  style,
}: Props) {
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(x, {
          toValue: 1,
          duration: durationMs,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(delayMs),
        Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delayMs, durationMs, x]);

  const translateX = x.interpolate({
    inputRange: [0, 1],
    outputRange: [-bandWidth, travel],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { width: bandWidth, transform: [{ translateX }] }, style]}
    >
      <LinearGradient colors={[...colors]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
  },
});
