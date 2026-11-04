import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";
import { DoorOpen, LifeBuoy, ShowerHead, Dumbbell, Waves } from "lucide-react-native";
import { type MapFilter } from "../../data/catalog";
import {
  ACADEMIA_ORLA,
  ESCUNA_POINT,
  MARLIN,
  ORLA_LANDMARKS,
  PLACES,
  SHOWERS,
  type Ambulante,
  type OrlaLandmark,
  type Place,
} from "../../data/places";
import { fold } from "../../data/coast";
import { useAmbulanteLive } from "../../context/AmbulanteLiveContext";
import { PIN_IMAGES } from "../../assets/pins";

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

function walkOffset(vendor: Ambulante, step: number) {
  if (!vendor.walks) return { lat: vendor.lat, lng: vendor.lng };
  const along = Math.sin((step / 8) * Math.PI * 2) * 0.00018;
  return { lat: vendor.lat + along * 0.74, lng: vendor.lng + along * 0.67 };
}

function KioskPin({ place, active }: { place: Place; active?: boolean }) {
  const num = place.name.match(/Quiosque\s+(\d+)/i)?.[1];
  return (
    <View style={styles.kioskWrap}>
      <Image source={PIN_IMAGES.quiosque} style={[styles.kioskImg, active && styles.scaleUp]} />
      {num ? (
        <View style={styles.kioskBadge}>
          <Text style={styles.kioskNum}>{num}</Text>
        </View>
      ) : null}
    </View>
  );
}

function CartPin({ active }: { active?: boolean }) {
  return <Image source={PIN_IMAGES.carrinho} style={[styles.cartImg, active && styles.scaleUp]} />;
}

function EscunaPin({ active }: { active?: boolean }) {
  return (
    <View style={[styles.escunaWrap, active && styles.scaleUp]}>
      <Image source={PIN_IMAGES.escunaWake} style={styles.escunaWake} />
      <Image source={PIN_IMAGES.escuna} style={styles.escunaBoat} />
      <View style={styles.escunaLabel}>
        <Text style={styles.escunaText}>Escunas</Text>
      </View>
    </View>
  );
}

function MarlinPin({ active }: { active?: boolean }) {
  return <Image source={PIN_IMAGES.marlin} style={[styles.marlinImg, active && styles.scaleUp]} />;
}

function GlyphPin({
  color,
  label,
  active,
  kind,
}: {
  color: string;
  label?: string;
  active?: boolean;
  kind: "ducha" | "banheiro" | "salva" | "academia" | "landmark";
}) {
  const Icon =
    kind === "ducha"
      ? ShowerHead
      : kind === "banheiro"
        ? DoorOpen
        : kind === "salva"
          ? LifeBuoy
          : kind === "academia"
            ? Dumbbell
            : Waves;
  return (
    <View style={styles.glyphWrap}>
      <View
        style={[
          styles.glyph,
          { backgroundColor: color, borderColor: active ? "#fff" : "rgba(255,255,255,0.9)" },
          active && styles.scaleUp,
        ]}
      >
        <Icon color="#fff" size={14} strokeWidth={2.4} />
      </View>
      {label ? (
        <View style={styles.labelPill}>
          <Text style={styles.labelText} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function landmarkKind(item: OrlaLandmark): "banheiro" | "salva" | "academia" | "landmark" {
  if (item.tone === "banheiro") return "banheiro";
  if (item.tone === "salva") return "salva";
  if (item.id === ACADEMIA_ORLA.id || item.tone === "academia") return "academia";
  return "landmark";
}

function landmarkColor(item: OrlaLandmark) {
  if (item.tone === "banheiro") return "#0369a1";
  if (item.tone === "salva") return "#dc2626";
  if (item.id === ACADEMIA_ORLA.id || item.tone === "academia") return "#b45309";
  if (item.tone === "golfinho") return "#1d4ed8";
  if (item.tone === "playground") return "#db2777";
  if (item.tone === "esporte") return "#c2410c";
  if (item.tone === "pier") return "#0e7490";
  if (item.tone === "park") return "#047857";
  if (item.tone === "praca") return "#7c3aed";
  if (item.tone === "abrigo") return "#b45309";
  return "#ca8a04";
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
      {/* Escuna — barco + onda */}
      {(filter === "neutro" || filter === "parceiros") &&
        matchesQuery(ESCUNA_POINT.name, query) && (
          <Marker
            coordinate={{ latitude: ESCUNA_POINT.lat, longitude: ESCUNA_POINT.lng }}
            onPress={() => onSelect(ESCUNA_POINT.id)}
            anchor={{ x: 0.5, y: 0.85 }}
            tracksViewChanges={false}
            zIndex={40}
          >
            <EscunaPin active={selectedId === ESCUNA_POINT.id || selectedId === "escunas"} />
          </Marker>
        )}

      {/* Marlin */}
      {filter === "neutro" && matchesQuery(MARLIN.name, query) && (
        <Marker
          coordinate={{ latitude: MARLIN.lat, longitude: MARLIN.lng }}
          onPress={() => onSelect(MARLIN.id)}
          anchor={{ x: 0.5, y: 0.9 }}
          tracksViewChanges={false}
          zIndex={35}
        >
          <MarlinPin active={selectedId === MARLIN.id} />
        </Marker>
      )}

      {SHOWERS.map((shower) => {
        const inCategory = filter === "neutro" || filter === "duchas";
        if (!inCategory || !matchesQuery(shower.name, query)) return null;
        return (
          <Marker
            key={`shower-${shower.id}`}
            coordinate={{ latitude: shower.lat, longitude: shower.lng }}
            onPress={() => onSelect(shower.id)}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            zIndex={20}
          >
            <GlyphPin
              color="#0284c7"
              kind="ducha"
              label={filter === "duchas" ? "Ducha" : undefined}
              active={selectedId === shower.id}
            />
          </Marker>
        );
      })}

      {PLACES.filter((place) => showPlaces || place.id === selectedId).map((place) => {
        const inCategory = filter === "neutro" || filter === place.mapKind;
        if (!inCategory || !matchesQuery(place.name, query)) return null;

        if (place.mapKind === "quiosques") {
          return (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.lat, longitude: place.lng }}
              onPress={() => onSelect(place.id)}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={false}
              zIndex={place.isSponsor ? 28 : 22}
            >
              <KioskPin place={place} active={selectedId === place.id} />
            </Marker>
          );
        }

        const color =
          place.mapKind === "hoteis"
            ? "#6d5ef5"
            : place.mapKind === "sorveterias"
              ? "#db2777"
              : "#059669";
        return (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.lat, longitude: place.lng }}
            onPress={() => onSelect(place.id)}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            zIndex={24}
          >
            <GlyphPin
              color={color}
              kind="landmark"
              label={place.isSponsor ? place.name.split(" ")[0] : undefined}
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
                anchor={{ x: 0.5, y: 0.9 }}
                tracksViewChanges={vendor.walks}
                zIndex={30}
              >
                <CartPin active={selectedId === vendor.id} />
              </Marker>
            );
          })}

      {ORLA_LANDMARKS.map((landmark) => {
        if (filter !== "neutro" && selectedId !== landmark.id) return null;
        if (!matchesQuery(landmark.name, query) && selectedId !== landmark.id) return null;
        return (
          <Marker
            key={landmark.id}
            coordinate={{ latitude: landmark.lat, longitude: landmark.lng }}
            onPress={() => onSelect(landmark.id)}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            zIndex={18}
          >
            <GlyphPin
              color={landmarkColor(landmark)}
              kind={landmarkKind(landmark)}
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
  scaleUp: { transform: [{ scale: 1.12 }] },
  kioskWrap: { alignItems: "center", width: 44 },
  kioskImg: { width: 40, height: 40, resizeMode: "contain" },
  kioskBadge: {
    marginTop: -6,
    backgroundColor: "#0f172a",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  kioskNum: { color: "#fff", fontSize: 10, fontWeight: "900" },
  cartImg: { width: 36, height: 36, resizeMode: "contain" },
  escunaWrap: { width: 78, height: 64, alignItems: "center", justifyContent: "flex-end" },
  escunaWake: {
    position: "absolute",
    bottom: 4,
    width: 72,
    height: 28,
    resizeMode: "contain",
    opacity: 0.85,
  },
  escunaBoat: { width: 56, height: 42, resizeMode: "contain", zIndex: 2 },
  escunaLabel: {
    marginTop: -2,
    backgroundColor: "rgba(15,23,42,0.88)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  escunaText: { color: "#fde68a", fontSize: 9, fontWeight: "900" },
  marlinImg: { width: 48, height: 48, resizeMode: "contain" },
  glyphWrap: { alignItems: "center" },
  glyph: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  labelPill: {
    marginTop: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: "rgba(15,23,42,0.88)",
    maxWidth: 78,
  },
  labelText: { color: "#fff", fontSize: 9, fontWeight: "800" },
});
