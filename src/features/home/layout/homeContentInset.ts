/**
 * Shared horizontal inset for Home hero (greeting + new-request + trip card).
 */
export function homeContentInset(width: number): number {
  if (width < 360) return 16;
  if (width < 400) return 20;
  if (width < 768) return 24;
  return 32;
}
