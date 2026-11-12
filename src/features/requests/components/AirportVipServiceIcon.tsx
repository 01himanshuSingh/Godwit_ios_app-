/**
 * Airport VIP card icon — ringing bell (dome, rim, clapper, side motion marks).
 * Proportions aligned to the New request design reference / Lucide bell-ring.
 */
import Svg, { Path } from 'react-native-svg';

type AirportVipServiceIconProps = {
  size?: number;
  color: string;
};

export function AirportVipServiceIcon({ size = 24, color }: AirportVipServiceIconProps) {
  const stroke = size >= 26 ? 1.85 : 1.7;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityRole="image">
      {/* Bell body */}
      <Path
        d="M6 8a6 6 0 0 1 12 0c0 4.5 1.4 6 2.75 7.35A1 1 0 0 1 20 17H4a1 1 0 0 1-.75-1.65C4.6 14 6 12.5 6 8Z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Clapper */}
      <Path
        d="M10.3 21a2 2 0 0 0 3.4 0"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left motion mark */}
      <Path d="M4 2c-1.2 1.7-2 3.7-2 6" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      {/* Right motion mark */}
      <Path d="M22 8c0-2.3-.8-4.3-2-6" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
    </Svg>
  );
}
