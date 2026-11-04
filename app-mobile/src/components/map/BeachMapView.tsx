import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { type Region, PROVIDER_DEFAULT } from "react-native-maps";
import { useApp } from "../../context/AppContext";
import { useUserLocation } from "../../hooks/useUserLocation";
import { map as mapTheme } from "../../theme/colors";
import { MapPins } from "./MapPins";
import { MuroPolylines } from "./MuroPolylines";
import { RampCorridors } from "./RampCorridors";
import { DayLayerOverlay } from "./DayLayerOverlay";

type Props = {
  onMuroPress?: () => void;
};

export function BeachMapView({ onMuroPress }: Props) {
  const mapRef = useRef<MapView>(null);
  const { filter, searchQuery, selectedId, setSelectedId, dayLayer, tide } = useApp();
  const { fix } = useUserLocation(true);
  const [region, setRegion] = useState<Region>({
    ...mapTheme.center,
    ...mapTheme.initialDelta,
  });
  const centeredOnce = useRef(false);

  useEffect(() => {
    if (!fix || centeredOnce.current || !mapRef.current) return;
    // Só recentra se o usuário estiver perto da orla (Praia do Morro).
    const nearBeach =
      Math.abs(fix.lat - mapTheme.center.latitude) < 0.08 &&
      Math.abs(fix.lng - mapTheme.center.longitude) < 0.08;
    if (!nearBeach) return;
    centeredOnce.current = true;
    mapRef.current.animateToRegion(
      { latitude: fix.lat, longitude: fix.lng, ...mapTheme.closeDelta },
      700,
    );
  }, [fix]);

  return (
    <View style={styles.fill}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled
        pitchEnabled={false}
        mapType="hybrid"
        userInterfaceStyle="light"
      >
        <DayLayerOverlay dayLayer={dayLayer} tide={tide.data} />
        <RampCorridors />
        <MuroPolylines latitudeDelta={region.latitudeDelta} onPress={onMuroPress} />
        <MapPins
          filter={filter}
          query={searchQuery}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
