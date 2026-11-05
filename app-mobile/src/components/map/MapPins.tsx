import { useEffect, useState, type ReactNode } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";
import {
  Anchor,
  Baby,
  DoorOpen,
  Footprints,
  Hotel,
  IceCreamCone,
  Landmark,
  LifeBuoy,
  ShowerHead,
  Trees,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react-native";
import { type MapFilter } from "../../data/catalog";
import {
  ACADEMIA_ORLA,
  ESCUNA_POINT,
  MARLIN,
  ORLA_LANDMARKS,
  PLACES,
  SHOWERS,
  type OrlaLandmark,
  type Place,
} from "../../data/places";
import { RAMPS } from "../../data/rampas";
import { fold } from "../../data/coast";
import { useAmbulanteLive } from "../../context/AmbulanteLiveContext";
import { PIN_IMAGES } from "../../assets/pins";
import { KioskMark } from "./KioskMark";
import { AcademiaMark, BenchMark, CourtMark, DolphinMark, RampaMark } from "./LandmarkMarks";
import { HeadingBeam } from "./HeadingBeam";
type Props = {
  filter: MapFilter;
  query: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Zoom alto — esconde comércio até aproximar (paridade PLACE_ZOOM web). */
  showDense?: boolean;
};

function matchesQuery(name: string, query: string) {
  if (!query.trim()) return true;
  return fold(name).includes(fold(query));
}

/** Mesmo algoritmo do web beach-map: vai e volta ao longo da areia. */
const SHORE_HEADING = (Math.atan2(0.67, 0.74) * 180) / Math.PI;

function walkOffset(vendor: { lat: number; lng: number; walks?: boolean }, step: number) {
  if (!vendor.walks) return { lat: vendor.lat, lng: vendor.lng, heading: SHORE_HEADING };
  const phase = step <= 4 ? step : 8 - step;
  const along = phase * 0.000045;
  const forward = step >= 1 && step <= 4;
  return {
    lat: vendor.lat + along * 0.74,
    lng: vendor.lng + along * 0.67,
    heading: forward ? SHORE_HEADING : SHORE_HEADING - 180,
  };
}

/** Paridade web: círculo branco + KioskMark SVG + número abaixo. Sem scale no select (salta o pin). */
function KioskPin({ place }: { place: Place; active?: boolean }) {
  const num = place.name.match(/Quiosque\s+(\d+)/i)?.[1];
  const premium = Boolean(place.isSponsor);
  return (
    <View style={styles.kioskWrap} collapsable={false}>
      <View style={[styles.kioskCircle, premium && styles.kioskCirclePremium]}>
        <KioskMark size={28} />
      </View>
      {num ? (
        premium ? (
          <View style={styles.kioskBadgePremium}>
            <Text style={styles.kioskNumPremium}>{num}</Text>
          </View>
        ) : (
          <View style={styles.kioskBadge}>
            <Text style={styles.kioskNum}>{num}</Text>
          </View>
        )
      ) : null}
    </View>
  );
}

function CartPin({
  heading,
  showBeam,
  name,
}: {
  active?: boolean;
  heading: number;
  showBeam?: boolean;
  name?: string;
}) {
  const flip = Math.sin((heading * Math.PI) / 180) < 0;
  return (
    <View style={styles.cartWrap} collapsable={false}>
      {showBeam ? <HeadingBeam heading={heading} size={72} /> : null}
      {name ? (
        <View style={styles.cartName}>
          <Text style={styles.cartNameText} numberOfLines={1}>
            {name}
          </Text>
        </View>
      ) : null}
      <Image
        source={PIN_IMAGES.carrinho}
        style={[styles.cartImg, { transform: [{ scaleX: flip ? -1 : 1 }], zIndex: 2 }]}
      />
    </View>
  );
}

/** Paridade web `escunaIcon` zoom&lt;18 → 140×98, label acima, barco −16°. */
function EscunaPin(_props: { active?: boolean }) {
  return (
    <View style={styles.escunaWrap} collapsable={false}>
      <View style={styles.escunaLabel}>
        <Text style={styles.escunaText}>Escunas</Text>
      </View>
      <View style={styles.escunaBoatWrap}>
        <Image source={PIN_IMAGES.escunaWake} style={styles.escunaWake} />
        <Image source={PIN_IMAGES.escuna} style={styles.escunaBoat} />
      </View>
    </View>
  );
}

function MarlinPin(_props: { active?: boolean }) {
  return (
    <View style={styles.marlinWrap} collapsable={false}>
      <View style={styles.marlinCircle}>
        <Image source={PIN_IMAGES.marlin} style={styles.marlinImg} />
      </View>
      <Text style={styles.marlinLabel}>Marlin</Text>
    </View>
  );
}

function RampaPinMark(_props: { active?: boolean }) {
  return (
    <View style={styles.glyphWrap} collapsable={false}>
      <View style={styles.rampaCircle}>
        <RampaMark size={22} />
      </View>
      <View style={styles.rampaBadge}>
        <Text style={styles.rampaBadgeText}>Rampa</Text>
      </View>
    </View>
  );
}

/** Duchas web: círculo claro + ícone azul (não círculo azul sólido). */
function ShowerPinMark({ label }: { label?: string; active?: boolean }) {
  return (
    <View style={styles.glyphWrap} collapsable={false}>
      {label ? (
        <View style={styles.showerLabel}>
          <Text style={styles.showerLabelText} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ) : null}
      <View style={styles.showerCircle}>
        <ShowerHead color="#0284c7" size={14} strokeWidth={2.3} />
      </View>
    </View>
  );
}

const TONE_BORDER: Record<string, string> = {
  pier: "#0e7490",
  park: "#047857",
  banheiro: "#0369a1",
  esporte: "#c2410c",
  academia: "#b45309",
  praca: "#7c3aed",
  acesso: "#a16207",
  abrigo: "#b45309",
  playground: "#db2777",
  salva: "#dc2626",
  golfinho: "#1d4ed8",
};

const TONE_LABEL: Record<string, string> = {
  pier: "#0e4a5c",
  park: "#065f46",
  banheiro: "#0c4a6e",
  esporte: "#9a3412",
  academia: "#9a3412",
  praca: "#5b21b6",
  acesso: "#854d0e",
  abrigo: "#92400e",
  playground: "#9d174d",
  salva: "#991b1b",
  golfinho: "#12315c",
};

const TONE_ICON: Record<string, LucideIcon | null> = {
  pier: Anchor,
  park: Trees,
  banheiro: DoorOpen,
  esporte: null,
  academia: null,
  praca: Landmark,
  acesso: Footprints,
  abrigo: null,
  playground: Baby,
  salva: LifeBuoy,
  golfinho: null,
};

function LandmarkPinMark({ item, active }: { item: OrlaLandmark; active?: boolean }) {
  const tone = item.tone;
  const border = TONE_BORDER[tone] ?? "#ca8a04";
  const labelColor = TONE_LABEL[tone] ?? "#854d0e";
  const box = tone === "park" || tone === "golfinho" ? 48 : tone === "abrigo" || tone === "academia" || tone === "praca" || tone === "playground" ? 28 : 40;
  const Icon = TONE_ICON[tone];

  let glyph: ReactNode = null;
  if (tone === "golfinho") glyph = <DolphinMark size={32} />;
  else if (tone === "abrigo") glyph = <BenchMark size={22} />;
  else if (tone === "esporte") glyph = <CourtMark size={26} />;
  else if (tone === "academia" || item.id === ACADEMIA_ORLA.id) glyph = <AcademiaMark size={22} />;
  else if (Icon) glyph = <Icon color={labelColor} size={box >= 40 ? 18 : 14} strokeWidth={2.4} />;

  return (
    <View style={styles.glyphWrap} collapsable={false}>
      <View
        style={[
          styles.landmarkCircle,
          {
            width: box,
            height: box,
            borderRadius: box / 2,
            borderColor: border,
            borderWidth: box <= 28 ? 1 : 2,
          },
        ]}
      >
        {glyph}
      </View>
      {item.short ? (
        <Text style={[styles.landmarkLabel, { color: labelColor }]} numberOfLines={1}>
          {item.short}
        </Text>
      ) : null}
    </View>
  );
}

function CommerceGlyph({
  kind,
  color,
}: {
  kind: Place["mapKind"];
  color: string;
  active?: boolean;
}) {
  const Icon =
    kind === "hoteis" ? Hotel : kind === "sorveterias" ? IceCreamCone : UtensilsCrossed;
  return (
    <View style={[styles.commerceCircle, { borderColor: color }]} collapsable={false}>
      <Icon color={color} size={14} strokeWidth={2.2} />
    </View>
  );
}

export function MapPins({
  filter,
  query,
  selectedId,
  onSelect,
  showDense = true,
}: Props) {
  const { vendors } = useAmbulanteLive();
  const [step, setStep] = useState(0);
  /**
   * Pulso de bitmap só quando o conjunto/visual dos pins muda (filtro/zoom/lista).
   * NUNCA no select — isso + balão no Marker era o salto areia↔cidade no iOS.
   */
  const [bootTracks, setBootTracks] = useState(true);
  /** Carrinhos andando precisam redesenhar a cada passo. */
  const [walkTracks, setWalkTracks] = useState(true);
  const categoryOk =
    filter === "neutro" ||
    filter === "quiosques" ||
    filter === "hoteis" ||
    filter === "sorveterias" ||
    filter === "parceiros";

  useEffect(() => {
    // 3s como no web — carrinhos andam na areia
    const id = setInterval(() => setStep((s) => (s + 1) % 8), 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setBootTracks(true);
    const id = setTimeout(() => setBootTracks(false), 600);
    return () => clearTimeout(id);
  }, [filter, query, showDense, vendors.length]);

  // Pulso curto só quando o passo do ambulante muda — NUNCA no select.
  useEffect(() => {
    setWalkTracks(true);
    const id = setTimeout(() => setWalkTracks(false), 400);
    return () => clearTimeout(id);
  }, [step]);

  return (
    <>
      {(filter === "neutro" || filter === "parceiros") && matchesQuery(ESCUNA_POINT.name, query) && (
        <Marker
          coordinate={{ latitude: ESCUNA_POINT.lat, longitude: ESCUNA_POINT.lng }}
          onPress={() => onSelect(ESCUNA_POINT.id)}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={bootTracks}
          zIndex={40}
        >
          <EscunaPin />
        </Marker>
      )}

      {(showDense || selectedId === MARLIN.id) && filter === "neutro" && matchesQuery(MARLIN.name, query) && (
        <Marker
          coordinate={{ latitude: MARLIN.lat, longitude: MARLIN.lng }}
          onPress={() => onSelect(MARLIN.id)}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={bootTracks}
          zIndex={selectedId === MARLIN.id ? 80 : 35}
        >
          <MarlinPin />
        </Marker>
      )}

      {SHOWERS.map((shower) => {
        const inCategory = filter === "neutro" || filter === "duchas";
        const focused = selectedId === shower.id;
        if ((!showDense && !focused) || !inCategory || !matchesQuery(shower.name, query)) return null;
        return (
          <Marker
            key={`shower-${shower.id}`}
            coordinate={{ latitude: shower.lat, longitude: shower.lng }}
            onPress={() => onSelect(shower.id)}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={bootTracks}
            zIndex={20}
          >
            <ShowerPinMark label={filter === "duchas" ? shower.name : undefined} />
          </Marker>
        );
      })}

      {PLACES.filter((place) => (showDense && categoryOk) || place.id === selectedId).map((place) => {
        const inCategory = filter === "neutro" || filter === place.mapKind;
        if (!inCategory || !matchesQuery(place.name, query)) return null;

        const selected = selectedId === place.id;
        // Pin congelado — balão fica no SelectedPinBubbleMarker (Marker separado).
        if (place.mapKind === "quiosques") {
          return (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.lat, longitude: place.lng }}
              onPress={() => onSelect(place.id)}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={bootTracks}
              zIndex={selected ? 85 : place.isSponsor ? 28 : 22}
            >
              <KioskPin place={place} />
            </Marker>
          );
        }

        const color =
          place.mapKind === "hoteis" ? "#6d5ef5" : place.mapKind === "sorveterias" ? "#db2777" : "#059669";
        return (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.lat, longitude: place.lng }}
            onPress={() => onSelect(place.id)}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={bootTracks}
            zIndex={selected ? 85 : 24}
          >
            <CommerceGlyph kind={place.mapKind} color={color} />
          </Marker>
        );
      })}

      {RAMPS.map((ramp) => {
        const focused = selectedId === ramp.id;
        if (!showDense && !focused) return null;
        if (filter !== "neutro" && !focused) return null;
        if (!matchesQuery(ramp.name, query) && !focused) return null;
        return (
          <Marker
            key={ramp.id}
            coordinate={{ latitude: ramp.lat, longitude: ramp.lng }}
            onPress={() => onSelect(ramp.id)}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={bootTracks}
            zIndex={focused ? 75 : 26}
          >
            <RampaPinMark />
          </Marker>
        );
      })}

      {(showDense || vendors.some((v) => v.id === selectedId)) &&
        (filter === "neutro" || filter === "ambulantes") &&
        vendors
          .filter((v) => v.isSponsor && v.isOnline)
          .map((vendor) => {
            if (!showDense && vendor.id !== selectedId) return null;
            if (!matchesQuery(vendor.name, query)) return null;
            const baseStep = (step + (vendor.id === "picole" ? 4 : 0)) % 8;
            const point = walkOffset(vendor, baseStep);
            const selected = selectedId === vendor.id;
            return (
              <Marker
                key={vendor.id}
                coordinate={{ latitude: point.lat, longitude: point.lng }}
                onPress={() => onSelect(vendor.id)}
                anchor={{ x: 0.5, y: 1 }}
                tracksViewChanges={vendor.walks ? walkTracks || bootTracks : bootTracks}
                zIndex={selected ? 85 : 30}
              >
                <CartPin heading={point.heading} showBeam name={vendor.name} />
              </Marker>
            );
          })}

      {ORLA_LANDMARKS.map((landmark) => {
        if (!showDense && selectedId !== landmark.id) return null;
        if (filter !== "neutro" && selectedId !== landmark.id) return null;
        if (!matchesQuery(landmark.name, query) && selectedId !== landmark.id) return null;
        const selected = selectedId === landmark.id;
        return (
          <Marker
            key={landmark.id}
            coordinate={{ latitude: landmark.lat, longitude: landmark.lng }}
            onPress={() => onSelect(landmark.id)}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={bootTracks}
            zIndex={selected ? 70 : 18}
          >
            <LandmarkPinMark item={landmark} />
          </Marker>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  kioskWrap: { alignItems: "center", width: 44 },
  kioskCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  kioskCirclePremium: { borderColor: "#fde68a" },
  kioskBadge: {
    marginTop: 2,
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  kioskNum: { color: "#3f2a1a", fontSize: 11, fontWeight: "800" },
  kioskBadgePremium: {
    marginTop: 2,
    backgroundColor: "#7c2d12",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: "#fde68a",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  kioskNumPremium: { color: "#f8e6c4", fontSize: 11, fontWeight: "800" },
  cartImg: { width: 34, height: 34, resizeMode: "contain" },
  /** Coluna web: balão em cima, ícone embaixo — âncora no pé do pin. */
  cartWrap: {
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
  },
  cartName: {
    position: "absolute",
    bottom: 40,
    maxWidth: 120,
    backgroundColor: "#fff",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#fff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 3,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  cartNameText: { color: "#7c2d12", fontSize: 10, fontWeight: "800" },
  escunaWrap: {
    width: 140,
    height: 118,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  escunaBoatWrap: {
    width: 140,
    height: 98,
    transform: [{ rotate: "-16deg" }],
  },
  escunaWake: {
    position: "absolute",
    right: "6%",
    bottom: "-40%",
    width: 154,
    height: 60,
    resizeMode: "contain",
    transform: [{ rotate: "174deg" }],
    zIndex: 0,
  },
  escunaBoat: { width: 140, height: 98, resizeMode: "contain", zIndex: 2 },
  escunaLabel: {
    position: "absolute",
    top: 0,
    zIndex: 3,
    backgroundColor: "#fff",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  escunaText: { color: "#3c2a18", fontSize: 10, fontWeight: "700" },
  marlinWrap: { alignItems: "center" },
  marlinCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#93c5fd",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  marlinImg: { width: 32, height: 32, resizeMode: "contain" },
  marlinLabel: {
    marginTop: 2,
    color: "#12315c",
    fontSize: 11,
    fontWeight: "800",
    textShadowColor: "#fff",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  rampaCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  rampaBadge: {
    marginTop: 2,
    backgroundColor: "#0b3a5b",
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  rampaBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  glyphWrap: { alignItems: "center" },
  showerCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0284c7",
    shadowOpacity: 0.45,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  showerLabel: {
    marginBottom: 4,
    maxWidth: 140,
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#fff",
  },
  showerLabelText: { color: "#3c2a18", fontSize: 11, fontWeight: "800" },
  landmarkCircle: {
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  landmarkLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "800",
    textShadowColor: "#fff",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
    maxWidth: 88,
  },
  commerceCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
