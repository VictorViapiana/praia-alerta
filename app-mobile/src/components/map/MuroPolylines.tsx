import { Polyline } from "react-native-maps";
import { MURO_SUL_ATE_Q1 } from "../../data/orla-muro";
import { colors } from "../../theme/colors";
import { approxZoomFromDelta, toLatLngList } from "../../utils/geo";

type Props = {
  latitudeDelta: number;
  onPress?: () => void;
};

/**
 * Guarda-corpo / para-peito — mesma técnica do web:
 * 1) corrimão fino contínuo (marrom madeira)
 * 2) pilastras tracejadas (dash curto + vão longo)
 * Só aparece com zoom aproximado >= 17.5
 */
export function MuroPolylines({ latitudeDelta, onPress }: Props) {
  const zoom = approxZoomFromDelta(latitudeDelta);
  if (zoom < 17.5 || MURO_SUL_ATE_Q1.length < 2) return null;

  const coords = toLatLngList(MURO_SUL_ATE_Q1);

  return (
    <>
      {/* Hit area larga */}
      <Polyline
        coordinates={coords}
        strokeColor="rgba(0,0,0,0.01)"
        strokeWidth={22}
        tappable
        onPress={onPress}
        zIndex={20}
      />
      {/* Corrimão */}
      <Polyline
        coordinates={coords}
        strokeColor={colors.woodRail}
        strokeWidth={2.5}
        lineCap="round"
        lineJoin="round"
        zIndex={21}
      />
      {/* Pilastras — dashArray equivalente Leaflet "3 20" */}
      <Polyline
        coordinates={coords}
        strokeColor={colors.woodPost}
        strokeWidth={6}
        lineDashPattern={[3, 20]}
        lineCap="butt"
        lineJoin="round"
        zIndex={22}
      />
    </>
  );
}
