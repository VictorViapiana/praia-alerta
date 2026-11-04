import { View, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";

type Props = {
  latitude: number;
  longitude: number;
  heading: number | null;
  navigating?: boolean;
};

/** Marcador do usuário — seta direcional durante navegação. */
export function UserArrow({ latitude, longitude, heading, navigating }: Props) {
  const deg = heading ?? 0;
  return (
    <Marker
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      rotation={navigating ? deg : 0}
      tracksViewChanges={false}
    >
      <View style={[styles.wrap, navigating && styles.nav]}>
        {navigating ? (
          <View style={styles.arrow} />
        ) : (
          <View style={styles.dot}>
            <View style={styles.dotInner} />
          </View>
        )}
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  nav: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 28,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#0091ff",
    transform: [{ translateY: -2 }],
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 3,
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
