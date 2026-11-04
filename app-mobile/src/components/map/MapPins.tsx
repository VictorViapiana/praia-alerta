import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";
import { PIN_COLORS, type MapFilter } from "../../data/catalog";
import {
  ACADEMIA_ORLA,
  AMBULANTES,
  ORLA_LANDMARKS,
  PLACES,
  SHOWERS,
} from "../../data/places";
import { fold } from "../../data/coast";

type Props = {
  filter: MapFilter;
  query: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function matchesQuery(name: string, query: string) {
  if (!query.trim()) return true;
  return fold(name).includes(fold(query));
}

function Dot({
  color,
  label,
  active,
}: {
  color: string;
  label?: string;
  active?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.dot, { backgroundColor: color, borderColor: active ? "#fff" : "rgba(255,255,255,0.85)", transform: [{ scale: active ? 1.15 : 1 }] }]} />
      {label ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function MapPins({ filter, query, selectedId, onSelect }: Props) {
  const showPlaces = filter === "neutro" || filter === "quiosques" || filter === "hoteis" || filter === "sorveterias" || filter === "parceiros";

  return (
    <>
      {SHOWERS.map((shower) => {
        const inCategory = filter === "neutro" || filter === "duchas";
        if (!inCategory || !matchesQuery(shower.name, query)) return null;
        return (
          <Marker
            key={`shower-${shower.id}`}
            coordinate={{ latitude: shower.lat, longitude: shower.lng }}
            onPress={() => onSelect(shower.id)}
            tracksViewChanges={false}
          >
            <Dot color={PIN_COLORS.duchas} label={filter === "duchas" ? "Ducha" : undefined} active={selectedId === shower.id} />
          </Marker>
        );
      })}

      {PLACES.filter((place) => showPlaces || place.id === selectedId).map((place) => {
        const inCategory = filter === "neutro" || filter === place.mapKind;
        if (!inCategory || !matchesQuery(place.name, query)) return null;
        const num = place.name.match(/Quiosque\s+(\d+)/i)?.[1];
        return (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.lat, longitude: place.lng }}
            onPress={() => onSelect(place.id)}
            tracksViewChanges={false}
          >
            <Dot
              color={PIN_COLORS[place.mapKind]}
              label={num ?? (filter !== "neutro" ? place.name.split(" ")[0] : undefined)}
              active={selectedId === place.id}
            />
          </Marker>
        );
      })}

      {(filter === "neutro" || filter === "ambulantes") &&
        AMBULANTES.filter((v) => v.isSponsor && v.isOnline).map((vendor) => {
          if (!matchesQuery(vendor.name, query)) return null;
          return (
            <Marker
              key={vendor.id}
              coordinate={{ latitude: vendor.lat, longitude: vendor.lng }}
              onPress={() => onSelect(vendor.id)}
              tracksViewChanges={false}
            >
              <Dot color={PIN_COLORS.ambulantes} label={filter === "ambulantes" ? "🛍️" : undefined} active={selectedId === vendor.id} />
            </Marker>
          );
        })}

      {ORLA_LANDMARKS.map((landmark) => {
        if (filter !== "neutro" && selectedId !== landmark.id) return null;
        if (!matchesQuery(landmark.name, query) && selectedId !== landmark.id) return null;
        const isAcademia = landmark.id === ACADEMIA_ORLA.id;
        return (
          <Marker
            key={landmark.id}
            coordinate={{ latitude: landmark.lat, longitude: landmark.lng }}
            onPress={() => onSelect(landmark.id)}
            tracksViewChanges={false}
          >
            <Dot
              color={isAcademia ? PIN_COLORS.academia : PIN_COLORS.landmark}
              label={landmark.short ?? landmark.name.split(" ")[0]}
              active={selectedId === landmark.id}
            />
          </Marker>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  badge: {
    marginTop: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: "rgba(15,23,42,0.82)",
    maxWidth: 72,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
});
