/**
 * Something else card icon — large 4-point sparkle + small + and dot accents.
 */
import Svg, { Circle, Path } from 'react-native-svg';

type SomethingElseServiceIconProps = {
  size?: number;
  color: string;
};

export function SomethingElseServiceIcon({ size = 24, color }: SomethingElseServiceIconProps) {
  const stroke = size >= 26 ? 1.85 : 1.7;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityRole="image">
      {/* Main 4-point star */}
      <Path
        d="M12 3.25 13.35 9.15a1.75 1.75 0 0 0 1.5 1.5L21 12l-6.15 1.35a1.75 1.75 0 0 0-1.5 1.5L12 20.75l-1.35-6.15a1.75 1.75 0 0 0-1.5-1.5L3 12l6.15-1.35a1.75 1.75 0 0 0 1.5-1.5Z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Small + (top-right) */}
      <Path d="M18.25 3.5v3.5" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <Path d="M20 5.25h-3.5" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      {/* Small dot (bottom-left) */}
      <Circle cx="5.25" cy="18.75" r="1.15" stroke={color} strokeWidth={stroke} />
    </Svg>
  );
}
