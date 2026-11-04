import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
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
import { approxZoomFromDelta, toLatLngList } from "../../utils/geo";

export type BeachMapHandle = {
  fitRoute: (route: WalkRoute) => void;
  animateTo: (lat: number, lng: number, delta?: number) => void;
  followUser: (lat: number, lng: number, heading: number | null, navigating?: boolean) => void;
};

type Props = {
  onMuroPress?: () => void;
  previewRoute?: WalkRoute | null;
  heading?: number | null;
  userLat?: number | null;
  userLng?: number | null;
  moving?: boolean;
  traveled?: Array<[number, number]>;
  remaining?: Array<[number, number]>;
};

export const BeachMapView = forwardRef<BeachMapHandle, Props>(function BeachMapView(
  {
    onMuroPress,
    previewRoute = null,
    heading = null,
    userLat = null,
    userLng = null,
    moving = false,
    traveled,
    remaining,
  },
  ref,
) {
  const mapRef = useRef<MapView>(null);
  const { filter, searchQuery, selectedId, setSelectedId, dayLayer, tide, nav, basemap } = useApp();
  const { fix } = useUserLocation(!nav?.active);
  const [region, setRegion] = useState<Region>({
    ...mapTheme.center,
    ...mapTheme.initialDelta,
  });
  const centeredOnce = useRef(false);
  const lastFollow = useRef(0);
  const navStartedAt = useRef(0);
  const wasNavigating = useRef(false);

  const lat = userLat ?? fix?.lat ?? null;
  const lng = userLng ?? fix?.lng ?? null;
  const navigating = Boolean(nav?.active);

  useImperativeHandle(ref, () => ({
    fitRoute(route) {
      if (!mapRef.current || route.line.length < 2) return;
      mapRef.current.fitToCoordinates(toLatLngList(route.line), {
        edgePadding: { top: 120, right: 48, bottom: 280, left: 48 },
        animated: true,
      });
    },
    animateTo(la, ln, delta = 0.006) {
      mapRef.current?.animateToRegion(
        { latitude: la, longitude: ln, latitudeDelta: delta, longitudeDelta: delta * 0.7 },
        650,
      );
    },
    followUser(la, ln, hdg, navMode = false) {
      mapRef.current?.animateCamera(
        {
          center: { latitude: la, longitude: ln },
          heading: hdg ?? 0,
          pitch: navMode ? 55 : 0,
          zoom: navMode ? 18.2 : 16.5,
        },
        { duration: navMode ? 450 : 700 },
      );
    },
  }));

  useEffect(() => {
    if (navigating && !wasNavigating.current) {
      navStartedAt.current = Date.now();
    }
    if (!navigating) navStartedAt.current = 0;
    wasNavigating.current = navigating;
  }, [navigating]);

  useEffect(() => {
    if (!lat || !lng || centeredOnce.current || navigating) return;
    const nearBeach =
      Math.abs(lat - mapTheme.center.latitude) < 0.08 &&
      Math.abs(lng - mapTheme.center.longitude) < 0.08;
    if (!nearBeach) return;
    centeredOnce.current = true;
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, ...mapTheme.closeDelta },
      700,
    );
  }, [lat, lng, navigating]);

  // Após enquadrar a rota inteira, segue o usuário em perspectiva (estilo Waze).
  useEffect(() => {
    if (!navigating || lat == null || lng == null) return;
    const sinceStart = Date.now() - navStartedAt.current;
    if (sinceStart < 1800) return;
    const now = Date.now();
    if (now - lastFollow.current < 700) return;
    lastFollow.current = now;
    mapRef.current?.animateCamera(
      {
        center: { latitude: lat, longitude: lng },
        heading: heading ?? 0,
        pitch: 55,
        zoom: 18.2,
      },
      { duration: 420 },
    );
  }, [navigating, lat, lng, heading]);

  const drawn = navigating ? nav?.route ?? null : previewRoute;
  // Satélite = foto da orla (como o web). Limpo = mapa sem POIs de terceiros.
  const mapType =
    basemap === "clean"
      ? Platform.OS === "ios"
        ? "mutedStandard"
        : "standard"
      : "satellite";
  // PLACE_ZOOM = 17 no web — pins densos só de perto.
  const showDensePins = approxZoomFromDelta(region.latitudeDelta) >= 17;

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
        showsPointsOfInterests={false}
        rotateEnabled
        pitchEnabled
        mapType={mapType}
        userInterfaceStyle="light"
        followsUserLocation={false}
        toolbarEnabled={false}
      >
        <DayLayerOverlay dayLayer={dayLayer} tide={tide.data} />
        <RampCorridors />
        <MuroPolylines latitudeDelta={region.latitudeDelta} onPress={onMuroPress} />
        <RouteLayer
          route={drawn}
          active={navigating}
          traveled={navigating ? traveled : undefined}
          remaining={navigating ? remaining : undefined}
        />
        {!navigating && (
          <MapPins
            filter={filter}
            query={searchQuery}
            selectedId={selectedId}
            onSelect={setSelectedId}
            showDense={showDensePins}
          />
        )}
        {lat != null && lng != null ? (
          <UserArrow
            latitude={lat}
            longitude={lng}
            heading={heading}
            navigating={navigating}
            moving={moving || navigating}
          />
        ) : null}
      </MapView>
    </View>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
