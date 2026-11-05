import { useEffect, useMemo, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import { useAmbulanteLive } from "../../context/AmbulanteLiveContext";
import { MARLIN, ORLA_LANDMARKS, PLACES } from "../../data/places";
import { RAMPS } from "../../data/rampas";
import { PlacePinBubble, SponsorPinBubble, VendorPinBubble } from "./PinBubbles";

type RoutePoint = { id: string; lat: number; lng: number; name: string };

type Props = {
  selectedId: string | null;
  onOpenSponsor?: (id: string) => void;
  onRoute?: (point: RoutePoint) => void;
};

type Target = {
  lat: number;
  lng: number;
  /** Altura do pin (anchor y=1). Spacer empurra o balão pra cima do ícone. */
  pinH: number;
  bubble: ReactNode;
};

function walkOffset(vendor: { lat: number; lng: number; walks?: boolean }, step: number) {
  if (!vendor.walks) return { lat: vendor.lat, lng: vendor.lng };
  const phase = step <= 4 ? step : 8 - step;
  const along = phase * 0.000045;
  return {
    lat: vendor.lat + along * 0.74,
    lng: vendor.lng + along * 0.67,
  };
}

/**
 * Balão num Marker SEPARADO do pin (mesma lat/lng).
 * Spacer = altura do pin → âncora no pé = ponta do ícone; balão fica logo acima.
 * O pin em MapPins nunca muda de tamanho → não salta no Apple Maps.
 * (Overlay + pointForCoordinate desalinhava o card no iOS.)
 */
export function SelectedPinBubbleMarker({ selectedId, onOpenSponsor, onRoute }: Props) {
  const { vendors } = useAmbulanteLive();
  const [step, setStep] = useState(0);
  const [tracks, setTracks] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 8), 3000);
    return () => clearInterval(id);
  }, []);

  // Pulso só ao montar/trocar seleção (ou passo do ambulante) — nunca mexe no pin.
  useEffect(() => {
    setTracks(true);
    const id = setTimeout(() => setTracks(false), 550);
    return () => clearTimeout(id);
  }, [selectedId, step]);

  const target = useMemo((): Target | null => {
    if (!selectedId) return null;
    const route = (point: RoutePoint) => () => onRoute?.(point);

    if (selectedId === MARLIN.id) {
      return {
        lat: MARLIN.lat,
        lng: MARLIN.lng,
        pinH: 58,
        bubble: (
          <PlacePinBubble
            name={MARLIN.name}
            hours={MARLIN.detail}
            onRoute={route({ id: MARLIN.id, lat: MARLIN.lat, lng: MARLIN.lng, name: MARLIN.name })}
          />
        ),
      };
    }

    const place = PLACES.find((p) => p.id === selectedId);
    if (place) {
      const pinH = place.mapKind === "quiosques" ? 62 : 36;
      const go = route({ id: place.id, lat: place.lat, lng: place.lng, name: place.name });
      return {
        lat: place.lat,
        lng: place.lng,
        pinH,
        bubble: place.isSponsor ? (
          <SponsorPinBubble
            name={place.name}
            hours={place.hours}
            tag={place.tag}
            cover={place.cover}
            onOpen={() => onOpenSponsor?.(place.id)}
            onRoute={go}
          />
        ) : (
          <PlacePinBubble name={place.name} hours={place.hours} onRoute={go} />
        ),
      };
    }

    const ramp = RAMPS.find((r) => r.id === selectedId);
    if (ramp) {
      return {
        lat: ramp.lat,
        lng: ramp.lng,
        pinH: 52,
        bubble: (
          <PlacePinBubble
            name={ramp.name}
            hours={ramp.detail}
            onRoute={route({ id: ramp.id, lat: ramp.lat, lng: ramp.lng, name: ramp.name })}
          />
        ),
      };
    }

    const landmark = ORLA_LANDMARKS.find((l) => l.id === selectedId);
    if (landmark) {
      return {
        lat: landmark.lat,
        lng: landmark.lng,
        pinH: landmark.tone === "golfinho" || landmark.tone === "park" ? 64 : 52,
        bubble: (
          <PlacePinBubble
            name={landmark.name}
            hours={landmark.detail}
            onRoute={route({
              id: landmark.id,
              lat: landmark.lat,
              lng: landmark.lng,
              name: landmark.name,
            })}
          />
        ),
      };
    }

    const vendor = vendors.find((v) => v.id === selectedId && v.isSponsor && v.isOnline);
    if (vendor) {
      const point = walkOffset(vendor, step + (vendor.id === "picole" ? 4 : 0));
      return {
        lat: point.lat,
        lng: point.lng,
        pinH: 78,
        bubble: (
          <VendorPinBubble
            name={vendor.name}
            tag={vendor.tag}
            onRoute={route({ id: vendor.id, lat: point.lat, lng: point.lng, name: vendor.name })}
          />
        ),
      };
    }

    return null;
  }, [selectedId, vendors, step, onOpenSponsor, onRoute]);

  if (!target) return null;

  return (
    <Marker
      coordinate={{ latitude: target.lat, longitude: target.lng }}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracks}
      zIndex={220}
      // Toque no card não deve propagar como tap no mapa (deselect).
      onPress={() => {}}
    >
      <View style={styles.stack} collapsable={false}>
        {target.bubble}
        {/* Reserva a altura do pin: âncora no mesmo pé do ícone → balão colado acima. */}
        <View style={{ height: target.pinH, width: 2 }} collapsable={false} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  stack: { alignItems: "center", backgroundColor: "transparent" },
});
