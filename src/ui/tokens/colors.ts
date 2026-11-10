/** Godwit design tokens — single source for brand colors. */
export const colors = {
  forest: '#1B2915',
  sand: '#D8CDB8',
  background: '#EDECEA',
  card: '#F7F6F4',
  surface: '#DEDBD4',
  border: '#D4D0C8',
  /** Slightly darker than `border` — header underline. */
  headerBorder: '#C2BDB4',
  muted: '#5C6658',
  /**
   * Request form field labels (CITY, CHECK IN, …).
   * Darker than `muted` so labels stay readable against sand/card surfaces.
   */
  fieldLabel: '#2F382C',
  accent: '#3D4F38',
  primaryForeground: '#F7F6F4',
} as const;

export type GodwitColor = (typeof colors)[keyof typeof colors];
