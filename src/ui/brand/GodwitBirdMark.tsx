/**
 * Godwit bird marks — pose variants for boot splash A/B on Testing.
 */
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { colors } from '@/ui/tokens/colors';

export type GodwitBirdVariant = 'standing' | 'flight' | 'wading' | 'abstract' | 'takeoff';

type GodwitBirdMarkProps = {
  size?: number;
  color?: string;
  variant?: GodwitBirdVariant;
};

function StandingMark({ size, color }: { size: number; color: string }) {
  const height = Math.round(size * 0.92);
  return (
    <Svg width={size} height={height} viewBox="0 0 160 148" fill="none">
      <Path d="M102 48 C118 42 136 38 152 40 C138 46 120 50 104 54 Z" fill={color} />
      <Ellipse cx="94" cy="52" rx="16" ry="14" fill={color} />
      <Circle cx="100" cy="48" r="2.2" fill={colors.background} />
      <Path d="M82 58 C78 64 74 72 72 78 C80 74 88 66 92 58 Z" fill={color} />
      <Ellipse cx="58" cy="86" rx="34" ry="22" fill={color} />
      <Path d="M42 78 C54 72 70 74 80 84 C68 88 52 88 42 82 Z" fill={color} opacity={0.45} />
      <Path d="M28 78 C18 72 10 74 6 82 C14 82 22 84 28 86 Z" fill={color} />
      <Path d="M48 104 L44 132 C43 138 48 140 52 136 L50 132 L52 104 Z" fill={color} />
      <Path d="M68 106 L66 134 C65 140 70 142 74 138 L72 134 L72 106 Z" fill={color} />
    </Svg>
  );
}

/** Wings open — energetic launch. */
function FlightMark({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 120" fill="none">
      {/* Left wing */}
      <Path
        d="M78 58
           C58 42 34 28 12 34
           C28 40 48 52 66 66
           C70 64 74 62 78 58
           Z"
        fill={color}
      />
      {/* Right wing */}
      <Path
        d="M82 58
           C102 42 126 28 148 34
           C132 40 112 52 94 66
           C90 64 86 62 82 58
           Z"
        fill={color}
      />
      {/* Body */}
      <Ellipse cx="80" cy="68" rx="14" ry="20" fill={color} />
      {/* Head */}
      <Ellipse cx="80" cy="42" rx="10" ry="9" fill={color} />
      <Circle cx="83" cy="40" r="1.8" fill={colors.background} />
      {/* Bill slightly up */}
      <Path d="M88 40 C98 36 108 34 116 36 C106 40 96 42 88 44 Z" fill={color} />
      {/* Tail */}
      <Path d="M74 86 C70 96 66 104 62 110 C72 104 78 96 82 88 Z" fill={color} />
    </Svg>
  );
}

/** Wading — bird + thin water line (travel / destination). */
function WadingMark({ size, color }: { size: number; color: string }) {
  const height = Math.round(size * 0.95);
  return (
    <Svg width={size} height={height} viewBox="0 0 160 150" fill="none">
      <Path d="M100 44 C116 38 134 36 150 38 C136 44 118 48 102 50 Z" fill={color} />
      <Ellipse cx="92" cy="50" rx="15" ry="13" fill={color} />
      <Circle cx="98" cy="46" r="2" fill={colors.background} />
      <Path d="M80 56 C76 62 72 70 70 76 C78 72 86 64 90 56 Z" fill={color} />
      <Ellipse cx="56" cy="84" rx="32" ry="20" fill={color} />
      <Path d="M40 76 C52 70 66 72 76 82 C64 86 48 86 40 80 Z" fill={color} opacity={0.4} />
      <Path d="M28 76 C18 70 10 72 6 80 C14 80 22 82 28 84 Z" fill={color} />
      {/* Legs into water */}
      <Path d="M50 100 L48 122" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M66 102 L68 124" stroke={color} strokeWidth={3} strokeLinecap="round" />
      {/* Water line */}
      <Path
        d="M18 126
           C36 120 52 132 70 126
           C88 120 104 132 122 126
           C132 124 142 128 148 126"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.55}
      />
      <Path
        d="M28 134
           C44 130 60 138 76 134
           C92 130 108 138 124 134"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.28}
      />
    </Svg>
  );
}

/** Abstract V / chevron wing mark — logo-like. */
function AbstractMark({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Path
        d="M18 78
           C28 58 48 36 60 28
           C72 36 92 58 102 78
           C88 70 74 58 60 48
           C46 58 32 70 18 78
           Z"
        fill={color}
      />
      <Path
        d="M44 82
           C52 70 60 62 60 62
           C60 62 68 70 76 82
           C68 78 60 72 60 72
           C60 72 52 78 44 82
           Z"
        fill={color}
        opacity={0.35}
      />
    </Svg>
  );
}

/** Landing / takeoff — wings mid-beat. */
function TakeoffMark({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 130" fill="none">
      {/* Upper left wing */}
      <Path
        d="M76 62
           C56 48 36 30 22 22
           C34 34 52 50 68 66
           Z"
        fill={color}
      />
      {/* Lower left wing tip */}
      <Path
        d="M72 70
           C58 78 42 88 30 98
           C44 90 58 80 72 72
           Z"
        fill={color}
        opacity={0.55}
      />
      {/* Upper right wing */}
      <Path
        d="M84 62
           C104 48 124 30 138 22
           C126 34 108 50 92 66
           Z"
        fill={color}
      />
      {/* Lower right wing tip */}
      <Path
        d="M88 70
           C102 78 118 88 130 98
           C116 90 102 80 88 72
           Z"
        fill={color}
        opacity={0.55}
      />
      <Ellipse cx="80" cy="72" rx="13" ry="18" fill={color} />
      <Ellipse cx="80" cy="48" rx="9" ry="8" fill={color} />
      <Circle cx="83" cy="46" r="1.6" fill={colors.background} />
      <Path d="M88 46 C98 42 108 40 116 42 C106 46 96 48 88 50 Z" fill={color} />
      <Path d="M74 88 C70 98 66 106 64 112 C74 106 80 98 84 90 Z" fill={color} />
    </Svg>
  );
}

export function GodwitBirdMark({
  size = 88,
  color = colors.forest,
  variant = 'standing',
}: GodwitBirdMarkProps) {
  switch (variant) {
    case 'flight':
      return <FlightMark size={size} color={color} />;
    case 'wading':
      return <WadingMark size={size} color={color} />;
    case 'abstract':
      return <AbstractMark size={size} color={color} />;
    case 'takeoff':
      return <TakeoffMark size={size} color={color} />;
    case 'standing':
    default:
      return <StandingMark size={size} color={color} />;
  }
}

export const GODWIT_BIRD_VARIANTS: {
  id: GodwitBirdVariant;
  label: string;
  hint: string;
}[] = [
  { id: 'standing', label: 'Standing', hint: 'Side profile · clearest godwit' },
  { id: 'flight', label: 'In flight', hint: 'Wings open · energetic launch' },
  { id: 'wading', label: 'Wading', hint: 'Water line · travel feel' },
  { id: 'abstract', label: 'Abstract', hint: 'V wing mark · logo-like' },
  { id: 'takeoff', label: 'Takeoff', hint: 'Mid-beat · subtle motion' },
];
