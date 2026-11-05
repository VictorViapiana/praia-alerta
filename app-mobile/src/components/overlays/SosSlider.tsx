import { useRef, useState } from "react";
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from "react-native";
import { GuaraPose } from "../guara/GuaraPose";
import { pulseEmergency } from "../../utils/haptics";

type Props = { onTrigger: () => void };

export function SosSlider({ onTrigger }: Props) {
  const [trackW, setTrackW] = useState(0);
  const x = useRef(0);
  const triggered = useRef(false);
  const [offset, setOffset] = useState(0);
  const maxRef = useRef(0);

  const max = Math.max(0, trackW - 56 - 8);
  maxRef.current = max;

  const finish = () => {
    if (triggered.current) return;
    const limit = maxRef.current;
    if (limit > 0 && x.current >= limit * 0.9) {
      triggered.current = true;
      setOffset(limit);
      void pulseEmergency().then(onTrigger);
      return;
    }
    x.current = 0;
    setOffset(0);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_e, g) => {
        if (triggered.current) return;
        const next = Math.max(0, Math.min(maxRef.current, g.dx));
        x.current = next;
        setOffset(next);
      },
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width);
  const progress = max ? offset / max : 0;

  return (
    <View style={styles.dock}>
      <View style={styles.guara}>
        <GuaraPose pose="emergencia" size={56} />
      </View>
      <View style={styles.track} onLayout={onLayout}>
        <View style={[styles.fillBar, { width: offset + 56 }]} />
        <Text style={[styles.label, { opacity: Math.max(0, 1 - progress / 0.72) }]}>
          {"Deslize para Emergência >>>"}
        </Text>
        {progress > 0.74 ? (
          <Text style={[styles.release, { opacity: Math.min(1, (progress - 0.74) / 0.18) }]}>
            Solte para acionar
          </Text>
        ) : null}
        <View style={[styles.knob, { transform: [{ translateX: offset }] }]} {...pan.panHandlers}>
          <GuaraPose pose="emergencia" size={36} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: { paddingTop: 28 },
  guara: { position: "absolute", left: 8, top: 0, zIndex: 2 },
  track: {
    height: 64,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
    justifyContent: "center",
  },
  fillBar: {
    position: "absolute",
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 999,
    backgroundColor: "rgba(220,38,38,0.75)",
  },
  label: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "500",
    paddingLeft: 40,
  },
  release: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  knob: {
    position: "absolute",
    left: 4,
    top: 4,
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ef4444",
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 6,
  },
});
