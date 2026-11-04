import { Polygon, Polyline } from "react-native-maps";
import type { DayLayer } from "../../data/day-layers";
import {
  isSunActive,
  sunSandBand,
  sunSandCore,
  tideEdgeLine,
  tideOceanBand,
  tideRatio,
  tideWaterBand,
  tideWetSandBand,
} from "../../data/day-layers";
import type { TideNow } from "../../data/coast";
import { toLatLngList } from "../../utils/geo";

type Props = {
  dayLayer: DayLayer;
  tide: TideNow | null | undefined;
};

/** Camadas Sol / Maré — mesma geometria do web. */
export function DayLayerOverlay({ dayLayer, tide }: Props) {
  if (dayLayer === "sol" && isSunActive()) {
    return (
      <>
        <Polygon
          coordinates={toLatLngList(sunSandBand())}
          fillColor="rgba(250,204,21,0.18)"
          strokeColor="rgba(250,204,21,0.35)"
          strokeWidth={1}
          zIndex={8}
        />
        <Polygon
          coordinates={toLatLngList(sunSandCore())}
          fillColor="rgba(251,191,36,0.28)"
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
