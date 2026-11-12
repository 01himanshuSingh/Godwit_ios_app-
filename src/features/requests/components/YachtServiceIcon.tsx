/**
 * Yacht card icon — outline sailboat with clear air between sails and hull.
 */
import Svg, { Line, Path } from 'react-native-svg';

type YachtServiceIconProps = {
  size?: number;
  color: string;
};

export function YachtServiceIcon({ size = 24, color }: YachtServiceIconProps) {
  const stroke = size >= 26 ? 1.75 : 1.6;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityRole="image">
      {/* Mast — stops above the hull so sails don’t sit on the deck */}
      <Line
        x1="11"
        y1="2.5"
        x2="11"
        y2="14"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {/* Left jib (smaller) — ends well above hull */}
      <Path
        d="M11 5.5V13H5.5Z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right mainsail (larger) */}
      <Path
        d="M11 2.75V13H19Z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Hull — lower in the frame for breathing room under the sails */}
      <Path
        d="M3.25 16.5H20.75C19.85 20.15 16.35 21.75 12 21.75C7.65 21.75 4.15 20.15 3.25 16.5Z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
