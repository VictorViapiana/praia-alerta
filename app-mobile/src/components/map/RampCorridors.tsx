import React from "react";
import { Polygon, Polyline } from "react-native-maps";
import { RAMPS } from "../../data/rampas";
import { toLatLngList } from "../../utils/geo";

/** Corredores das rampas (Marlin + Norte) — polígono + bordas. */
export function RampCorridors() {
  return (
    <>
      {RAMPS.map((ramp) => (
        <React.Fragment key={ramp.id}>
          <Polygon
            coordinates={toLatLngList(ramp.corridor)}
            fillColor="rgba(14,165,233,0.18)"
            strokeColor="rgba(14,165,233,0.55)"
            strokeWidth={1}
            zIndex={12}
          />
          <Polyline
            coordinates={toLatLngList(ramp.edgeLeft)}
            strokeColor="rgba(255,255,255,0.85)"
            strokeWidth={2}
            lineDashPattern={[8, 6]}
            zIndex={13}
          />
          <Polyline
            coordinates={toLatLngList(ramp.edgeRight)}
            strokeColor="rgba(255,255,255,0.85)"
            strokeWidth={2}
            lineDashPattern={[8, 6]}
            zIndex={13}
          />
        </React.Fragment>
      ))}
    </>
  );
}
