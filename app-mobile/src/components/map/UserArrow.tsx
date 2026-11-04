import { View, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import Svg, { Path, Circle } from "react-native-svg";

type Props = {
  latitude: number;
  longitude: number;
  heading: number | null;
  navigating?: boolean;
  moving?: boolean;
};

/** Seta direcional premium (nav) / ponto azul (parado). */
export function UserArrow({ latitude, longitude, heading, navigating, moving }: Props) {
  const deg = heading ?? 0;
  return (
    <Marker
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      rotation={navigating || moving ? deg : 0}
      tracksViewChanges={Boolean(navigating)}
      zIndex={80}
    >
      {navigating || moving ? (
        <View style={styles.navWrap}>
          {moving ? <View style={styles.pulse} /> : null}
          <Svg width={40} height={40} viewBox="0 0 40 40">
            <Circle cx={20} cy={20} r={18} fill="rgba(0,163,255,0.18)" />
            <Path
              d="M20 4 L32 30 L20 24 L8 30 Z"
              fill="#00A3FF"
              stroke="#ffffff"
              strokeWidth={2.2}
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      ) : (
        <View style={styles.dot}>
          <View style={styles.dotInner} />
        </View>
      )}
    </Marker>
  );
}

const styles = StyleSheet.create({
  navWrap: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "rgba(0,163,255,0.22)",
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "rgba(14,165,233,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  dotInner: { width: 12, height: 12, borderRadius: 999, backgroundColor: "#0284c7" },
});
