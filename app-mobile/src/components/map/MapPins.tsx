import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";
import { PIN_COLORS, type MapFilter } from "../../data/catalog";
import { ACADEMIA_ORLA, ORLA_LANDMARKS, PLACES, SHOWERS, type Ambulante } from "../../data/places";
import { fold } from "../../data/coast";
import { useAmbulanteLive } from "../../context/AmbulanteLiveContext";

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
  cart,
}: {
  color: string;
  label?: string;
  active?: boolean;
  cart?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <View
        style={[
          cart ? styles.cart : styles.dot,
          {
            backgroundColor: color,
            borderColor: active ? "#fff" : "rgba(255,255,255,0.85)",
            transform: [{ scale: active ? 1.15 : 1 }],
          },
        ]}
      >
        {cart ? <Text style={styles.cartEmoji}>🛒</Text> : null}
      </View>
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

function walkOffset(vendor: Ambulante, step: number) {
  if (!vendor.walks) return { lat: vendor.lat, lng: vendor.lng };
  const along = Math.sin((step / 8) * Math.PI * 2) * 0.00018;
  return {
    lat: vendor.lat + along * 0.74,
    lng: vendor.lng + along * 0.67,
  };
}

export function MapPins({ filter, query, selectedId, onSelect }: Props) {
  const { vendors } = useAmbulanteLive();
  const [step, setStep] = useState(0);
  const showPlaces =
    filter === "neutro" ||
    filter === "quiosques" ||
    filter === "hoteis" ||
    filter === "sorveterias" ||
    filter === "parceiros";

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 8), 2200);
    return () => clearInterval(id);
  }, []);

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
            <Dot
              color={PIN_COLORS.duchas}
              label={filter === "duchas" ? "Ducha" : undefined}
              active={selectedId === shower.id}
            />
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
        vendors
          .filter((v) => v.isSponsor && v.isOnline)
          .map((vendor) => {
            if (!matchesQuery(vendor.name, query)) return null;
            const point = walkOffset(vendor, step + (vendor.id === "picole" ? 4 : 0));
            return (
              <Marker
                key={vendor.id}
                coordinate={{ latitude: point.lat, longitude: point.lng }}
                onPress={() => onSelect(vendor.id)}
                tracksViewChanges={vendor.walks}
              >
                <Dot
                  color={PIN_COLORS.ambulantes}
                  label={filter === "ambulantes" ? vendor.name.split(" ")[0] : undefined}
                  active={selectedId === vendor.id}
                  cart
                />
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
  cart: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  cartEmoji: { fontSize: 12 },
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
