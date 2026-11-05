import { useEffect, useMemo, useState, type ReactNode, type RefObject } from "react";
import { StyleSheet, View } from "react-native";
import type MapView from "react-native-maps";
import { useAmbulanteLive } from "../../context/AmbulanteLiveContext";
import { MARLIN, ORLA_LANDMARKS, PLACES } from "../../data/places";
import { RAMPS } from "../../data/rampas";
import { PlacePinBubble, SponsorPinBubble, VendorPinBubble } from "./PinBubbles";

type RoutePoint = { id: string; lat: number; lng: number; name: string };

type Props = {
  mapRef: RefObject<MapView | null>;
  selectedId: string | null;
  /** Qualquer mudança de região força recalcular o pixel do pin. */
  regionKey: string;
  onOpenSponsor?: (id: string) => void;
  onRoute?: (point: RoutePoint) => void;
};

type Target = {
  lat: number;
  lng: number;
  /** Altura visual do pin (anchor y=1 = ponta inferior no lat/lng). */
  pinH: number;
  bubble: ReactNode;
};

/** Mesmo offset do MapPins — carrinhos andam na areia. */
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
 * Balão FORA do Marker. No Apple Maps, mudar a altura do filho do Marker no
 * select reposiciona o pin (salta areia ↔ cidade). Overlay + pointForCoordinate
 * mantém o pin congelado e ancora o card acima do ícone.
 */
export function SelectedPinOverlay({
  mapRef,
  selectedId,
  regionKey,
  onOpenSponsor,
  onRoute,
}: Props) {
  const { vendors } = useAmbulanteLive();
  const [step, setStep] = useState(0);
  const [pt, setPt] = useState<{ x: number; y: number } | null>(null);
  const [box, setBox] = useState({ w: 232, h: 120 });

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 8), 3000);
    return () => clearInterval(id);
  }, []);

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
      const pinH = place.mapKind === "quiosques" ? 58 : 36;
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

  useEffect(() => {
    let cancelled = false;
    if (!target) {
      setPt(null);
      return;
    }
    const map = mapRef.current;
    if (!map?.pointForCoordinate) {
      setPt(null);
      return;
    }
    map
      .pointForCoordinate({ latitude: target.lat, longitude: target.lng })
      .then((point) => {
        if (!cancelled) setPt(point);
      })
      .catch(() => {
        if (!cancelled) setPt(null);
      });
    return () => {
      cancelled = true;
    };
  }, [target?.lat, target?.lng, selectedId, regionKey, mapRef]);

  if (!target || !pt) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.layer,
        {
          left: pt.x - box.w / 2,
          top: pt.y - target.pinH - box.h - 6,
        },
      ]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0 && (width !== box.w || height !== box.h)) {
          setBox({ w: width, h: height });
        }
      }}
    >
      {target.bubble}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    zIndex: 40,
    elevation: 40,
  },
});
