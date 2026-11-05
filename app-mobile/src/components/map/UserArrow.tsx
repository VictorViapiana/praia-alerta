import { View, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";

type Props = {
  latitude: number;
  longitude: number;
  heading: number | null;
  navigating?: boolean;
  moving?: boolean;
};

/** Seta / feixe de rumo — cone sempre que há heading (paridade web HeadingBeam). */
export function UserArrow({ latitude, longitude, heading, navigating, moving }: Props) {
  const deg = heading ?? 0;
  const showBeam = heading != null;
  const active = Boolean(navigating || moving);

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      rotation={showBeam ? deg : 0}
      tracksViewChanges={Boolean(navigating || moving)}
      zIndex={80}
    >
      {showBeam ? (
        <View style={styles.navWrap}>
          {moving ? <View style={styles.pulse} /> : null}
          <Svg width={56} height={56} viewBox="0 0 56 56">
            <Defs>
              <LinearGradient id="beam" x1="28" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#38bdf8" stopOpacity="0.55" />
                <Stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Path d="M28 6 L40 30 L28 24 L16 30 Z" fill="url(#beam)" opacity={0.9} />
            <Circle cx={28} cy={28} r={active ? 18 : 14} fill="rgba(0,163,255,0.18)" />
            <Path
              d="M28 12 L36 34 L28 28 L20 34 Z"
              fill="#00A3FF"
              stroke="#ffffff"
              strokeWidth={2}
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
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: 48,
    height: 48,
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
