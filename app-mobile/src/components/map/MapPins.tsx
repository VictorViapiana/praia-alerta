import { Fragment, useEffect, useState, type ReactNode } from "react";
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
import { PlacePinBubble, SponsorPinBubble, VendorPinBubble } from "./PinBubbles";

type Props = {
  filter: MapFilter;
  query: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Zoom alto — esconde comércio até aproximar (paridade PLACE_ZOOM web). */
  showDense?: boolean;
  /** Abre portal completo do patrocinador. */
  onOpenSponsor?: (id: string) => void;
  /** Inicia rota até o ponto. */
  onRoute?: (point: { id: string; lat: number; lng: number; name: string }) => void;
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

/** Paridade web: círculo branco + KioskMark SVG + número abaixo. */
function KioskPin({ place, active }: { place: Place; active?: boolean }) {
  const num = place.name.match(/Quiosque\s+(\d+)/i)?.[1];
  const premium = Boolean(place.isSponsor);
  return (
    <View style={[styles.kioskWrap, active && styles.scaleUp]}>
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
  active,
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
      {showBeam ? <HeadingBeam heading={heading} size={110} /> : null}
      {!active && name ? (
        <View style={styles.cartName}>
          <Text style={styles.cartNameText} numberOfLines={1}>
            {name}
          </Text>
        </View>
      ) : null}
      <Image
        source={PIN_IMAGES.carrinho}
        style={[
          styles.cartImg,
          {
            transform: [{ scaleX: flip ? -1 : 1 }, { scale: active ? 1.12 : 1 }],
            zIndex: 2,
          },
        ]}
      />
    </View>
  );
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
  return (
    <View style={[styles.marlinWrap, active && styles.scaleUp]}>
      <View style={styles.marlinCircle}>
        <Image source={PIN_IMAGES.marlin} style={styles.marlinImg} />
      </View>
      <Text style={styles.marlinLabel}>Marlin</Text>
    </View>
  );
}

function RampaPinMark({ active }: { active?: boolean }) {
  return (
    <View style={[styles.glyphWrap, active && styles.scaleUp]}>
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
function ShowerPinMark({ label, active }: { label?: string; active?: boolean }) {
  return (
    <View style={styles.glyphWrap}>
      {label ? (
        <View style={styles.showerLabel}>
          <Text style={styles.showerLabelText} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ) : null}
      <View style={[styles.showerCircle, active && styles.scaleUp]}>
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
    <View style={[styles.glyphWrap, active && styles.scaleUp]}>
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
  active,
}: {
  kind: Place["mapKind"];
  color: string;
  active?: boolean;
}) {
  const Icon =
    kind === "hoteis" ? Hotel : kind === "sorveterias" ? IceCreamCone : UtensilsCrossed;
  return (
    <View style={[styles.commerceCircle, { borderColor: color }, active && styles.scaleUp]}>
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
  onOpenSponsor,
  onRoute,
}: Props) {
  const { vendors } = useAmbulanteLive();
  const [step, setStep] = useState(0);
  const [tracks, setTracks] = useState(true);
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

  // tracksViewChanges só por um instante — deixar true faz o pin “pular”/tremer.
  useEffect(() => {
    setTracks(true);
    const id = setTimeout(() => setTracks(false), 450);
    return () => clearTimeout(id);
  }, [filter, query, showDense, vendors.length, selectedId, step]);

  return (
    <>
      {/* Escuna sempre no canal (não depende de zoom denso — fácil de perder no sul). */}
      {(filter === "neutro" || filter === "parceiros") && matchesQuery(ESCUNA_POINT.name, query) && (
        <Marker
          coordinate={{ latitude: ESCUNA_POINT.lat, longitude: ESCUNA_POINT.lng }}
          onPress={() => onSelect(ESCUNA_POINT.id)}
          anchor={{ x: 0.5, y: 0.85 }}
          tracksViewChanges={tracks}
          zIndex={40}
        >
          <EscunaPin active={selectedId === ESCUNA_POINT.id || selectedId === "escunas"} />
        </Marker>
      )}

      {(showDense || selectedId === MARLIN.id) && filter === "neutro" && matchesQuery(MARLIN.name, query) && (
        <>
          {selectedId === MARLIN.id ? (
            <Marker
              key="marlin-bubble"
              coordinate={{ latitude: MARLIN.lat, longitude: MARLIN.lng }}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={tracks}
              zIndex={90}
              tappable={false}
            >
              <View style={styles.bubblePad} collapsable={false}>
                <PlacePinBubble
                  name={MARLIN.name}
                  hours={MARLIN.detail}
                  onRoute={() =>
                    onRoute?.({ id: MARLIN.id, lat: MARLIN.lat, lng: MARLIN.lng, name: MARLIN.name })
                  }
                />
              </View>
            </Marker>
          ) : null}
          <Marker
            coordinate={{ latitude: MARLIN.lat, longitude: MARLIN.lng }}
            onPress={() => onSelect(MARLIN.id)}
            anchor={{ x: 0.5, y: 0.9 }}
            tracksViewChanges={false}
            zIndex={35}
          >
            <MarlinPin active={selectedId === MARLIN.id} />
          </Marker>
        </>
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
            tracksViewChanges={false}
            zIndex={20}
          >
            <ShowerPinMark label={filter === "duchas" ? shower.name : undefined} active={focused} />
          </Marker>
        );
      })}

      {PLACES.filter((place) => (showDense && categoryOk) || place.id === selectedId).map((place) => {
        const inCategory = filter === "neutro" || filter === place.mapKind;
        if (!inCategory || !matchesQuery(place.name, query)) return null;

        const selected = selectedId === place.id;
        if (place.mapKind === "quiosques") {
          return (
            <Fragment key={place.id}>
              {selected ? (
                <Marker
                  coordinate={{ latitude: place.lat, longitude: place.lng }}
                  anchor={{ x: 0.5, y: 1 }}
                  tracksViewChanges={tracks}
                  zIndex={90}
                  tappable={false}
                >
                  <View style={styles.bubblePad} collapsable={false}>
                    {place.isSponsor ? (
                      <SponsorPinBubble
                        name={place.name}
                        hours={place.hours}
                        tag={place.tag}
                        cover={place.cover}
                        onOpen={() => onOpenSponsor?.(place.id)}
                        onRoute={() =>
                          onRoute?.({ id: place.id, lat: place.lat, lng: place.lng, name: place.name })
                        }
                      />
                    ) : (
                      <PlacePinBubble
                        name={place.name}
                        hours={place.hours}
                        onRoute={() =>
                          onRoute?.({ id: place.id, lat: place.lat, lng: place.lng, name: place.name })
                        }
                      />
                    )}
                  </View>
                </Marker>
              ) : null}
              <Marker
                coordinate={{ latitude: place.lat, longitude: place.lng }}
                onPress={() => onSelect(place.id)}
                anchor={{ x: 0.5, y: 1 }}
                tracksViewChanges={false}
                zIndex={place.isSponsor ? 28 : 22}
              >
                <KioskPin place={place} active={selected} />
              </Marker>
            </Fragment>
          );
        }

        const color =
          place.mapKind === "hoteis" ? "#6d5ef5" : place.mapKind === "sorveterias" ? "#db2777" : "#059669";
        return (
          <Fragment key={place.id}>
            {selected ? (
              <Marker
                coordinate={{ latitude: place.lat, longitude: place.lng }}
                anchor={{ x: 0.5, y: 1 }}
                tracksViewChanges={tracks}
                zIndex={90}
                tappable={false}
              >
                <View style={styles.bubblePad} collapsable={false}>
                  {place.isSponsor ? (
                    <SponsorPinBubble
                      name={place.name}
                      hours={place.hours}
                      tag={place.tag}
                      cover={place.cover}
                      onOpen={() => onOpenSponsor?.(place.id)}
                      onRoute={() =>
                        onRoute?.({ id: place.id, lat: place.lat, lng: place.lng, name: place.name })
                      }
                    />
                  ) : (
                    <PlacePinBubble
                      name={place.name}
                      hours={place.hours}
                      onRoute={() =>
                        onRoute?.({ id: place.id, lat: place.lat, lng: place.lng, name: place.name })
                      }
                    />
                  )}
                </View>
              </Marker>
            ) : null}
            <Marker
              coordinate={{ latitude: place.lat, longitude: place.lng }}
              onPress={() => onSelect(place.id)}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              zIndex={24}
            >
              <CommerceGlyph kind={place.mapKind} color={color} active={selected} />
            </Marker>
          </Fragment>
        );
      })}

      {RAMPS.map((ramp) => {
        const focused = selectedId === ramp.id;
        if (!showDense && !focused) return null;
        if (filter !== "neutro" && !focused) return null;
        if (!matchesQuery(ramp.name, query) && !focused) return null;
        return (
          <Fragment key={ramp.id}>
            {focused ? (
              <Marker
                coordinate={{ latitude: ramp.lat, longitude: ramp.lng }}
                anchor={{ x: 0.5, y: 1 }}
                tracksViewChanges={tracks}
                zIndex={90}
                tappable={false}
              >
                <View style={styles.bubblePad} collapsable={false}>
                  <PlacePinBubble
                    name={ramp.name}
                    hours={ramp.detail}
                    onRoute={() =>
                      onRoute?.({ id: ramp.id, lat: ramp.lat, lng: ramp.lng, name: ramp.name })
                    }
                  />
                </View>
              </Marker>
            ) : null}
            <Marker
              coordinate={{ latitude: ramp.lat, longitude: ramp.lng }}
              onPress={() => onSelect(ramp.id)}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              zIndex={26}
            >
              <RampaPinMark active={focused} />
            </Marker>
          </Fragment>
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
              <Fragment key={vendor.id}>
                {selected ? (
                  <Marker
                    coordinate={{ latitude: point.lat, longitude: point.lng }}
                    anchor={{ x: 0.5, y: 1 }}
                    tracksViewChanges={tracks}
                    zIndex={95}
                    tappable={false}
                  >
                    <View style={styles.bubblePad} collapsable={false}>
                      <VendorPinBubble
                        name={vendor.name}
                        tag={vendor.tag}
                        onRoute={() =>
                          onRoute?.({
                            id: vendor.id,
                            lat: point.lat,
                            lng: point.lng,
                            name: vendor.name,
                          })
                        }
                      />
                    </View>
                  </Marker>
                ) : null}
                <Marker
                  coordinate={{ latitude: point.lat, longitude: point.lng }}
                  onPress={() => onSelect(vendor.id)}
                  anchor={{ x: 0.5, y: 0.9 }}
                  tracksViewChanges={vendor.walks ? tracks : false}
                  zIndex={30}
                >
                  <CartPin
                    active={selected}
                    heading={point.heading}
                    showBeam
                    name={vendor.name}
                  />
                </Marker>
              </Fragment>
            );
          })}

      {ORLA_LANDMARKS.map((landmark) => {
        if (!showDense && selectedId !== landmark.id) return null;
        if (filter !== "neutro" && selectedId !== landmark.id) return null;
        if (!matchesQuery(landmark.name, query) && selectedId !== landmark.id) return null;
        const selected = selectedId === landmark.id;
        return (
          <Fragment key={landmark.id}>
            {selected ? (
              <Marker
                coordinate={{ latitude: landmark.lat, longitude: landmark.lng }}
                anchor={{ x: 0.5, y: 1 }}
                tracksViewChanges={tracks}
                zIndex={90}
                tappable={false}
              >
                <View style={styles.bubblePad} collapsable={false}>
                  <PlacePinBubble
                    name={landmark.name}
                    hours={landmark.detail}
                    onRoute={() =>
                      onRoute?.({
                        id: landmark.id,
                        lat: landmark.lat,
                        lng: landmark.lng,
                        name: landmark.name,
                      })
                    }
                  />
                </View>
              </Marker>
            ) : null}
            <Marker
              coordinate={{ latitude: landmark.lat, longitude: landmark.lng }}
              onPress={() => onSelect(landmark.id)}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              zIndex={18}
            >
              <LandmarkPinMark item={landmark} active={selected} />
            </Marker>
          </Fragment>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  scaleUp: { transform: [{ scale: 1.12 }] },
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
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  kioskNum: { color: "#3f2a1a", fontSize: 11, fontWeight: "800" },
  kioskBadgePremium: {
    marginTop: 2,
    backgroundColor: "#7c2d12",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#f6e6c4",
  },
  kioskNumPremium: { color: "#f8e6c4", fontSize: 11, fontWeight: "800" },
  cartImg: { width: 36, height: 36, resizeMode: "contain" },
  pinStack: { alignItems: "center" },
  /** Empurra o bubble pra cima do pin — Marker separado, âncora fixa no chão. */
  bubblePad: {
    alignItems: "center",
    paddingBottom: 44,
  },
  cartWrap: {
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  cartName: {
    position: "absolute",
    bottom: 52,
    maxWidth: 140,
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
  escunaWrap: { width: 96, height: 78, alignItems: "center", justifyContent: "flex-end" },
  escunaWake: {
    position: "absolute",
    bottom: 6,
    width: 88,
    height: 34,
    resizeMode: "contain",
    opacity: 0.9,
  },
  escunaBoat: { width: 72, height: 54, resizeMode: "contain", zIndex: 2 },
  escunaLabel: {
    marginTop: -2,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  escunaText: { color: "#fde68a", fontSize: 10, fontWeight: "900" },
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
