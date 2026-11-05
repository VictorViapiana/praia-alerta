import { View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

/** Feixe de direção — paridade web `HeadingBeam` (ambulantes / usuário). */
export function HeadingBeam({ heading, size = 56 }: { heading: number; size?: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: size,
        height: size,
        left: "50%",
        top: "50%",
        marginLeft: -size / 2,
        marginTop: -size / 2,
        transform: [{ rotate: `${heading}deg` }],
        zIndex: 0,
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 220 220">
        <Defs>
          <LinearGradient id="wash" x1="110" y1="110" x2="110" y2="12" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#f7fffe" stopOpacity="0.35" />
            <Stop offset="16%" stopColor="#b8fff6" stopOpacity="0.82" />
            <Stop offset="42%" stopColor="#1ad4ff" stopOpacity="0.62" />
            <Stop offset="74%" stopColor="#5b7cff" stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#e4c8ff" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="core" x1="110" y1="110" x2="110" y2="18" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
            <Stop offset="28%" stopColor="#d9fff8" stopOpacity="0.72" />
            <Stop offset="70%" stopColor="#7af6ff" stopOpacity="0.16" />
            <Stop offset="100%" stopColor="#7af6ff" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d="M110 110 L72 18 Q110 4 148 18 Z" fill="url(#wash)" />
        <Path d="M110 110 L92 28 Q110 16 128 28 Z" fill="url(#core)" />
      </Svg>
    </View>
  );
}
