import Svg, { Ellipse, Path, Rect } from "react-native-svg";

/** Quiosque SVG do web (`beach-map.tsx` KioskMark) — círculo branco + número embaixo. */
export function KioskMark({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Ellipse cx="24" cy="43.2" rx="13" ry="1.8" fill="#9a3412" opacity={0.22} />
      <Path
        d="M3 24.5c7-2.2 13-12 21-15.2 8 3.2 14 13 21 15.2-1.6 2.4-9 3.6-21 3.6S4.6 26.9 3 24.5Z"
        fill="#ea580c"
      />
      <Path
        d="M8 23.2c5.2-1.6 10.4-8.2 16-10.6 5.6 2.4 10.8 9 16 10.6"
        fill="none"
        stroke="#fdba74"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M7.5 25.2c4.6 1.4 10.2 2.2 16.5 2.2s11.9-.8 16.5-2.2"
        fill="none"
        stroke="#9a3412"
        strokeWidth={1.15}
        opacity={0.55}
      />
      <Path
        d="M9.5 27.2 12 31l2.5-3.8 2.5 3.8 2.5-3.8 2.5 3.8 2.5-3.8 2.5 3.8 2.5-3.8 2.5 3.8L34 27.2"
        fill="none"
        stroke="#c2410c"
        strokeWidth={1.35}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Rect x="14.2" y="28.4" width="3" height="11.2" rx="1" fill="#9a3412" />
      <Rect x="30.8" y="28.4" width="3" height="11.2" rx="1" fill="#7c2d12" />
      <Path
        d="M11.5 33.2h25v3.3c0 .9-.7 1.6-1.6 1.6H13.1c-.9 0-1.6-.7-1.6-1.6v-3.3Z"
        fill="#fb923c"
      />
      <Path d="M11.5 33.2h25v1.35h-25Z" fill="#fff7ed" />
      <Rect x="10.2" y="39.4" width="27.6" height="2.5" rx="1" fill="#9a3412" />
    </Svg>
  );
}
