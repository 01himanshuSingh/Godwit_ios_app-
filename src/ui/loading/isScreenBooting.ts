/**
 * Screen boot vs section loading — product rule:
 *
 * - **Boot** (first paint, no content yet): `ScreenBootLoader` (Godwit bird).
 * - **Section** (chrome already on screen, one block waiting): feature Skeleton.
 * - Never drive boot UI from `isFetching` alone — refetch must keep content.
 */

export type ScreenBootArgs = {
  /** Session / profile hydrate. */
  isHydrating?: boolean;
  /** Optional fonts gate (Home). Default true. */
  fontsReady?: boolean;
  /**
   * Whether the primary query is allowed to run.
   * When false (e.g. missing scope), do not boot — show the exception UI.
   */
  enabled?: boolean;
  /** Primary query still on first request. */
  isPending: boolean;
  /** True once we have something to show (card, list rows, etc.). */
  hasContent: boolean;
  /** Terminal error / exception ready to render instead of a loader. */
  hasTerminalError?: boolean;
};

/** True only for the first empty paint of a screen. */
export function isScreenBooting({
  isHydrating = false,
  fontsReady = true,
  enabled = true,
  isPending,
  hasContent,
  hasTerminalError = false,
}: ScreenBootArgs): boolean {
  if (!fontsReady) return true;
  if (isHydrating) return true;
  if (!enabled) return false;
  if (hasTerminalError) return false;
  if (hasContent) return false;
  return isPending;
}
