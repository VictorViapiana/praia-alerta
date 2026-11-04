import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { type Region, PROVIDER_DEFAULT } from "react-native-maps";
import { useApp } from "../../context/AppContext";
import { useUserLocation } from "../../hooks/useUserLocation";
import { map as mapTheme } from "../../theme/colors";
import { MapPins } from "./MapPins";
import { MuroPolylines } from "./MuroPolylines";
import { RampCorridors } from "./RampCorridors";
import { DayLayerOverlay } from "./DayLayerOverlay";
import { RouteLayer } from "./RouteLayer";
import { UserArrow } from "./UserArrow";
import type { WalkRoute } from "../../data/walk-route";
import { toLatLngList } from "../../utils/geo";

export type BeachMapHandle = {
  fitRoute: (route: WalkRoute) => void;
  animateTo: (lat: number, lng: number, delta?: number) => void;
  followUser: (lat: number, lng: number, heading: number | null) => void;
};

type Props = {
  onMuroPress?: () => void;
  previewRoute?: WalkRoute | null;
  heading?: number | null;
};

export const BeachMapView = forwardRef<BeachMapHandle, Props>(function BeachMapView(
  { onMuroPress, previewRoute = null, heading = null },
  ref,
) {
  const mapRef = useRef<MapView>(null);
  const { filter, searchQuery, selectedId, setSelectedId, dayLayer, tide, nav } = useApp();
  const { fix } = useUserLocation(true);
  const [region, setRegion] = useState<Region>({
    ...mapTheme.center,
    ...mapTheme.initialDelta,
  });
  const centeredOnce = useRef(false);

  useImperativeHandle(ref, () => ({
    fitRoute(route) {
      if (!mapRef.current || route.line.length < 2) return;
      mapRef.current.fitToCoordinates(toLatLngList(route.line), {
        edgePadding: { top: 120, right: 48, bottom: 280, left: 48 },
        animated: true,
      });
    },
    animateTo(lat, lng, delta = 0.006) {
      mapRef.current?.animateToRegion(
        { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta * 0.7 },
        600,
      );
    },
    followUser(lat, lng, hdg) {
      mapRef.current?.animateCamera(
        {
          center: { latitude: lat, longitude: lng },
          heading: hdg ?? 0,
          pitch: 45,
          zoom: 17.5,
        },
        { duration: 500 },
      );
    },
  }));

  useEffect(() => {
    if (!fix || centeredOnce.current || !mapRef.current) return;
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

  useEffect(() => {
    if (!nav?.active || !fix) return;
    mapRef.current?.animateCamera(
      {
        center: { latitude: fix.lat, longitude: fix.lng },
        heading: heading ?? 0,
        pitch: 50,
        zoom: 18,
      },
      { duration: 400 },
    );
  }, [nav?.active, fix?.lat, fix?.lng, heading]);

  const drawn = nav?.active ? nav.route : previewRoute;

  return (
    <View style={styles.fill}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled
        pitchEnabled
        mapType="hybrid"
        userInterfaceStyle="light"
        followsUserLocation={false}
      >
        <DayLayerOverlay dayLayer={dayLayer} tide={tide.data} />
        <RampCorridors />
        <MuroPolylines latitudeDelta={region.latitudeDelta} onPress={onMuroPress} />
        <RouteLayer route={drawn} active={Boolean(nav?.active)} />
        <MapPins
          filter={filter}
          query={searchQuery}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        {fix ? (
          <UserArrow
            latitude={fix.lat}
            longitude={fix.lng}
            heading={heading}
            navigating={Boolean(nav?.active)}
          />
        ) : null}
      </MapView>
    </View>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
