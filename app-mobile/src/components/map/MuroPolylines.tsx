import { Polyline } from "react-native-maps";
import { MURO_SUL_ATE_Q1 } from "../../data/orla-muro";
import { colors } from "../../theme/colors";
import { approxZoomFromDelta, toLatLngList } from "../../utils/geo";

type Props = {
  latitudeDelta: number;
  onPress?: () => void;
};

/**
 * Guarda-corpo / para-peito (sul → Quiosque 01).
 * Zoom >= 16 para aparecer junto com a orla (web 17.5 era invisível no RN).
 */
export function MuroPolylines({ latitudeDelta, onPress }: Props) {
  const zoom = approxZoomFromDelta(latitudeDelta);
  if (zoom < 16 || MURO_SUL_ATE_Q1.length < 2) return null;

  const coords = toLatLngList(MURO_SUL_ATE_Q1);

  return (
    <>
      <Polyline
        coordinates={coords}
        strokeColor="rgba(0,0,0,0.01)"
        strokeWidth={28}
        tappable
        onPress={onPress}
        zIndex={20}
      />
      <Polyline
        coordinates={coords}
        strokeColor={colors.woodRail}
        strokeWidth={3.5}
        lineCap="round"
        lineJoin="round"
        zIndex={21}
      />
      <Polyline
        coordinates={coords}
        strokeColor={colors.woodPost}
        strokeWidth={7}
        lineDashPattern={[4, 18]}
        lineCap="butt"
        lineJoin="round"
        zIndex={22}
      />
    </>
  );
}
