import { Marker, Polyline } from "react-native-maps";
import type { WalkRoute } from "../../data/walk-route";
import { toLatLngList } from "../../utils/geo";

type Props = {
  route: WalkRoute | null;
  active?: boolean;
};

/** Polyline premium: sombra + traço vibrante grosso (estilo Waze). */
export function RouteLayer({ route, active }: Props) {
  if (!route || route.line.length < 2) return null;
  const coords = toLatLngList(route.line);
  const end = coords[coords.length - 1];

  return (
    <>
      <Polyline coordinates={coords} strokeColor="rgba(15,23,42,0.35)" strokeWidth={active ? 14 : 12} zIndex={30} lineCap="round" lineJoin="round" />
      <Polyline
        coordinates={coords}
        strokeColor={active ? "#0091ff" : "#38bdf8"}
        strokeWidth={active ? 8 : 6}
        zIndex={31}
        lineCap="round"
        lineJoin="round"
      />
      {end ? (
        <Marker coordinate={end} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
          {/* destination pin via default marker tint */}
        </Marker>
      ) : null}
    </>
  );
}
