/** Godwit design tokens — single source for brand colors. */
export const colors = {
  forest: '#1B2915',
  sand: '#D8CDB8',
  background: '#EDECEA',
  card: '#F7F6F4',
  surface: '#DEDBD4',
  border: '#D4D0C8',
  muted: '#5C6658',
  accent: '#3D4F38',
  primaryForeground: '#F7F6F4',
} as const;

export type GodwitColor = (typeof colors)[keyof typeof colors];
