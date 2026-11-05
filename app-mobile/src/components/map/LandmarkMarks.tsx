import Svg, { Circle, Path, Rect } from "react-native-svg";

/** Marcas SVG do web (`beach-map.tsx`) — bancos, quadra, academia, golfinho. */

export function BenchMark({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path
        d="M4.5 14.2 16 5.2 27.5 14.2v1.8H4.5Z"
        fill="#fb923c"
        stroke="#9a3412"
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      <Path d="M7.2 16h17.6v1.5H7.2Z" fill="#c2410c" />
      <Path d="M10 17.4v8.4M22 17.4v8.4" fill="none" stroke="#7c2d12" strokeWidth={1.8} strokeLinecap="round" />
      <Path
        d="M7.4 20.2h17.2v2.4c0 .6-.5 1.1-1.1 1.1H8.5c-.6 0-1.1-.5-1.1-1.1v-2.4Z"
        fill="#fde68a"
        stroke="#92400e"
        strokeWidth={0.9}
      />
      <Path d="M8.2 23.8h15.6v1.5H8.2Z" fill="#b45309" />
    </Svg>
  );
}

export function CourtMark({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect x="2.2" y="9" width="27.6" height="14" rx="2" fill="#f6d7a2" stroke="#9a3412" strokeWidth={1.4} />
      <Path d="M16 9v14" stroke="#fff7ed" strokeWidth={1.6} />
      <Path d="M16 9.4v13.2" stroke="#57534e" strokeWidth={0.8} strokeDasharray="1.5 1.35" />
      <Circle cx="22.4" cy="16" r="2.15" fill="#fff" stroke="#ea580c" strokeWidth={1.15} />
    </Svg>
  );
}

export function AcademiaMark({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect x="2.2" y="9.2" width="4.2" height="13.6" rx="1.4" fill="#9a3412" />
      <Rect x="5.2" y="11.2" width="3.2" height="9.6" rx="1.1" fill="#c2410c" />
      <Rect x="7.8" y="14.2" width="16.4" height="3.6" rx="1.8" fill="#7c2d12" />
      <Rect x="9.2" y="14.85" width="13.6" height="1.1" rx="0.55" fill="#fdba74" opacity={0.85} />
      <Rect x="23.6" y="11.2" width="3.2" height="9.6" rx="1.1" fill="#c2410c" />
      <Rect x="25.6" y="9.2" width="4.2" height="13.6" rx="1.4" fill="#9a3412" />
    </Svg>
  );
}

export function DolphinMark({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path
        d="M18 36c1.5-12 14-20 28-15 7 2.4 12 8 13 13-3 .4-6-.2-8-2-1 9-8 15-17 15-1.5 7 3 12 9 13-9 2.2-16-1.2-18-8-7 2.4-15-.4-16-7 .2-3 2.4-6 5-9Z"
        fill="#2f6fed"
        stroke="#0c2340"
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <Path d="M16 34 5 22l6 11L5 44l11-6Z" fill="#1d4ed8" stroke="#0c2340" strokeWidth={2} strokeLinejoin="round" />
      <Path d="M30 20 26 7l11 11Z" fill="#1e4fd7" stroke="#0c2340" strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M34 36 27 49l13-8Z" fill="#1d4ed8" stroke="#0c2340" strokeWidth={1.7} strokeLinejoin="round" />
      <Path d="M28 34c8-1 16-4 22-2-3 7-12 11-22 9-2-2-2-5 0-7Z" fill="#dbeafe" />
      <Circle cx="46" cy="26" r="3.1" fill="#fff" stroke="#0c2340" strokeWidth={1.3} />
      <Circle cx="47.1" cy="26.1" r="1.45" fill="#0c2340" />
      <Path d="M50 31c2.2 1.6 4.2 1.5 6 .2" fill="none" stroke="#0c2340" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
