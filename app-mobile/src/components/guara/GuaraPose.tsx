import { Image, type ImageStyle, type StyleProp } from "react-native";
import { GUARA_POSE, type GuaraPoseId } from "../../data/guara-poses";

type Props = {
  pose?: GuaraPoseId;
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export function GuaraPose({ pose = "bust", size = 48, style }: Props) {
  return (
    <Image
      source={GUARA_POSE[pose]}
      style={[{ width: size, height: size, resizeMode: "contain" }, style]}
      accessibilityIgnoresInvertColors
    />
  );
}
