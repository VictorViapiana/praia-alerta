import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { GuaraPose } from "../guara/GuaraPose";
import { pulseEmergency } from "../../utils/haptics";

const HOLD_MS = 1200;
const R = 24;
const C = 2 * Math.PI * R;

type Props = {
  onTrigger: () => void;
  top?: number;
};

/** Segure para acionar emergência — com haptic nativo ao completar. */
export function SosHoldButton({ onTrigger, top = 120 }: Props) {
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);

  const cancel = () => {
    if (frame.current != null) cancelAnimationFrame(frame.current);
    frame.current = null;
    origin.current = null;
    setProgress(0);
  };

  useEffect(() => () => cancel(), []);

  const start = (x: number, y: number) => {
    origin.current = { x, y };
    const started = performance.now();
    const step = (now: number) => {
      const next = Math.min(1, (now - started) / HOLD_MS);
      setProgress(next);
      if (next >= 1) {
        frame.current = null;
        origin.current = null;
        void pulseEmergency().then(() => onTrigger());
        setProgress(0);
        return;
      }
      frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  };

  return (
    <View style={[styles.wrap, { top }]} pointerEvents="box-none">
      <Pressable
        accessibilityLabel="Segure para acionar emergência"
        onPressIn={(e) => start(e.nativeEvent.pageX, e.nativeEvent.pageY)}
        onPressOut={cancel}
        onTouchMove={(e) => {
          const startPt = origin.current;
          if (!startPt) return;
          const t = e.nativeEvent.touches[0];
          if (!t) return;
          const dx = t.pageX - startPt.x;
          const dy = t.pageY - startPt.y;
          if (dx * dx + dy * dy > 14 * 14) cancel();
        }}
        style={styles.btn}
      >
        <Svg width={56} height={56} style={StyleSheet.absoluteFill} viewBox="0 0 56 56">
          <Circle cx={28} cy={28} r={R} stroke="rgba(255,255,255,0.16)" strokeWidth={3} fill="none" />
          <Circle
            cx={28}
            cy={28}
            r={R}
            stroke="#fecaca"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${C}`}
            strokeDashoffset={C * (1 - progress)}
            rotation={-90}
            origin="28, 28"
          />
        </Svg>
        <GuaraPose pose="emergencia" size={40} style={{ transform: [{ scale: progress > 0 ? 1.1 : 1 }] }} />
      </Pressable>
      <Text style={styles.caption}>{progress > 0 ? "Segure" : "Emergência"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 12, zIndex: 40, alignItems: "center" },
  btn: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(254,202,202,0.3)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  caption: {
    marginTop: 4,
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
