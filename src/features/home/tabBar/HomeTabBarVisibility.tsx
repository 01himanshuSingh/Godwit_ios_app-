/**
 * Coordinates fixed HomeTabBar visibility across tab screens.
 * Bar stays docked (no scroll-hide). New request flow can fully suppress it.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

type HomeTabBarVisibilityValue = {
  /** Always false for the static dock — kept for API compatibility. */
  hidden: boolean;
  /** true when bar must not render (New request overlay). */
  suppressed: boolean;
  setSuppressed: (next: boolean) => void;
  /** No-op for static bar; kept so scroll props stay valid. */
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle: number;
  /** No-op for static bar; kept for tab-change call sites. */
  reveal: () => void;
};

const HomeTabBarVisibilityContext = createContext<HomeTabBarVisibilityValue | null>(null);

export function HomeTabBarVisibilityProvider({ children }: { children: ReactNode }) {
  const [suppressed, setSuppressedState] = useState(false);

  const setSuppressed = useCallback((next: boolean) => {
    setSuppressedState(next);
  }, []);

  const reveal = useCallback(() => undefined, []);

  const onScroll = useCallback((_event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Static dock — ignore scroll.
  }, []);

  const value = useMemo(
    () => ({
      hidden: false,
      suppressed,
      setSuppressed,
      onScroll,
      scrollEventThrottle: 16,
      reveal,
    }),
    [onScroll, reveal, setSuppressed, suppressed],
  );

  return (
    <HomeTabBarVisibilityContext.Provider value={value}>
      {children}
    </HomeTabBarVisibilityContext.Provider>
  );
}

export function useHomeTabBarVisibility(): HomeTabBarVisibilityValue {
  const ctx = useContext(HomeTabBarVisibilityContext);
  if (!ctx) {
    return {
      hidden: false,
      suppressed: false,
      setSuppressed: () => undefined,
      onScroll: () => undefined,
      scrollEventThrottle: 16,
      reveal: () => undefined,
    };
  }
  return ctx;
}

/** Convenience props for ScrollView / list components. */
export function useHomeTabBarScrollProps() {
  const { onScroll, scrollEventThrottle } = useHomeTabBarVisibility();
  return { onScroll, scrollEventThrottle };
}

/**
 * While mounted, hide the HomeTabBar completely (New request flow).
 * Restores the tab bar on unmount.
 */
export function useSuppressHomeTabBar(enabled = true) {
  const { setSuppressed } = useHomeTabBarVisibility();

  useEffect(() => {
    if (!enabled) return;
    setSuppressed(true);
    return () => setSuppressed(false);
  }, [enabled, setSuppressed]);
}
