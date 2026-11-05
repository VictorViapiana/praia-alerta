import { View, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import Svg, { Path, Circle } from "react-native-svg";
import { HeadingBeam } from "./HeadingBeam";

type Props = {
  latitude: number;
  longitude: number;
  heading: number | null;
  navigating?: boolean;
  moving?: boolean;
};

/** Localização do usuário — feixe HeadingBeam + seta (paridade web UserDot). */
export function UserArrow({ latitude, longitude, heading, navigating, moving }: Props) {
  const deg = heading ?? 0;
  const showBeam = heading != null;
  const active = Boolean(navigating || moving);

  if (navigating) {
    return (
      <Marker
        coordinate={{ latitude, longitude }}
        anchor={{ x: 0.5, y: 0.5 }}
        flat
        rotation={deg}
        tracksViewChanges
        zIndex={80}
      >
        <View style={styles.navWrap}>
          <View style={styles.pulse} />
          <Svg width={44} height={44} viewBox="0 0 48 48">
            <Path
              d="M24 6 40 40 24 32 8 40Z"
              fill="#1d4ed8"
              stroke="#ffffff"
              strokeWidth={3}
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </Marker>
    );
  }

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      tracksViewChanges={Boolean(moving)}
      zIndex={80}
    >
      <View style={styles.idleWrap}>
        {showBeam ? <HeadingBeam heading={deg} size={72} /> : null}
        {moving ? <View style={styles.ring} /> : null}
        <View style={styles.dot}>
          <View style={styles.dotInner} />
        </View>
        {active ? null : <View style={styles.labelPad} />}
      </View>
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
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "rgba(29,78,216,0.25)",
  },
  idleWrap: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(2,132,199,0.45)",
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
    zIndex: 2,
  },
  dotInner: { width: 12, height: 12, borderRadius: 999, backgroundColor: "#0284c7" },
  labelPad: { height: 0 },
});
