import { Polygon, Polyline } from "react-native-maps";
import type { DayLayer } from "../../data/day-layers";
import {
  isSunActive,
  sunHeatFactor,
  sunSandRings,
  tideEdgeLine,
  tideOceanBand,
  tideRatio,
  tideWaterBand,
  tideWetSandBand,
} from "../../data/day-layers";
import type { TideNow, WeatherNow } from "../../data/coast";
import { toLatLngList } from "../../utils/geo";

type Props = {
  dayLayer: DayLayer;
  tide: TideNow | null | undefined;
  weather?: WeatherNow | null;
};

/** Camadas Sol / Maré — 4 anéis com heat do clima (paridade web). */
export function DayLayerOverlay({ dayLayer, tide, weather }: Props) {
  if (dayLayer === "sol" && isSunActive()) {
    const heat = sunHeatFactor(new Date(), weather ? { code: weather.code, uv: weather.uv } : null);
    const rings = sunSandRings();
    return (
      <>
        <Polygon
          coordinates={toLatLngList(rings.glow)}
          fillColor={`rgba(250,204,21,${(0.08 * heat).toFixed(3)})`}
          strokeColor="transparent"
          strokeWidth={0}
          zIndex={6}
        />
        <Polygon
          coordinates={toLatLngList(rings.wash)}
          fillColor={`rgba(250,204,21,${(0.14 * heat).toFixed(3)})`}
          strokeColor={`rgba(250,204,21,${(0.28 * heat).toFixed(3)})`}
          strokeWidth={1}
          zIndex={7}
        />
        <Polygon
          coordinates={toLatLngList(rings.mid)}
          fillColor={`rgba(251,191,36,${(0.2 * heat).toFixed(3)})`}
          strokeColor="transparent"
          strokeWidth={0}
          zIndex={8}
        />
        <Polygon
          coordinates={toLatLngList(rings.core)}
          fillColor={`rgba(245,158,11,${(0.32 * heat).toFixed(3)})`}
          strokeColor="transparent"
          strokeWidth={0}
          zIndex={9}
        />
      </>
    );
  }

  if (dayLayer === "mare" && tide) {
    const ratio = tideRatio(tide.level, tide.rangeMin, tide.rangeMax);
    if (ratio == null) return null;
    return (
      <>
        <Polygon
          coordinates={toLatLngList(tideOceanBand(ratio))}
          fillColor="rgba(14,116,144,0.45)"
          strokeColor="transparent"
          strokeWidth={0}
          zIndex={6}
        />
        <Polygon
          coordinates={toLatLngList(tideWaterBand(ratio))}
          fillColor="rgba(34,211,238,0.28)"
          strokeColor="transparent"
          strokeWidth={0}
          zIndex={7}
        />
        <Polygon
          coordinates={toLatLngList(tideWetSandBand(ratio))}
          fillColor="rgba(125,211,252,0.18)"
          strokeColor="transparent"
          strokeWidth={0}
          zIndex={8}
        />
        <Polyline
          coordinates={toLatLngList(tideEdgeLine(ratio))}
          strokeColor="rgba(255,255,255,0.65)"
          strokeWidth={2}
          zIndex={9}
        />
      </>
    );
  }

  return null;
}
