/**
 * Coordinates floating HomeTabBar visibility across tab screens.
 * - On scroll: hide; after idle delay: show again.
 * - New request flow: fully suppress (unmount) the tab bar for full-screen forms.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

const HIDE_IDLE_MS = 1100;
const SCROLL_DELTA = 4;

type HomeTabBarVisibilityValue = {
  /** true when bar should be off-screen (scroll hide) */
  hidden: boolean;
  /** true when bar must not render at all (New request overlay) */
  suppressed: boolean;
  setSuppressed: (next: boolean) => void;
  /** Attach to ScrollView / FlashList / FlatList */
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle: number;
  /** Force visible (e.g. tab change) — ignored while suppressed */
  reveal: () => void;
};

const HomeTabBarVisibilityContext = createContext<HomeTabBarVisibilityValue | null>(null);

export function HomeTabBarVisibilityProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const [suppressed, setSuppressedState] = useState(false);
  const lastYRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleReveal = useCallback(() => {
    if (suppressed) return;
    clearTimer();
    timerRef.current = setTimeout(() => {
      setHidden(false);
      timerRef.current = null;
    }, HIDE_IDLE_MS);
  }, [clearTimer, suppressed]);

  const reveal = useCallback(() => {
    clearTimer();
    if (!suppressed) setHidden(false);
  }, [clearTimer, suppressed]);

  const setSuppressed = useCallback(
    (next: boolean) => {
      setSuppressedState(next);
      if (next) {
        clearTimer();
        setHidden(true);
      } else {
        setHidden(false);
      }
    },
    [clearTimer],
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (suppressed) return;

      const y = event.nativeEvent.contentOffset.y;
      const dy = y - lastYRef.current;
      lastYRef.current = y;

      if (Math.abs(dy) < SCROLL_DELTA && y > 0) {
        scheduleReveal();
        return;
      }

      setHidden(true);
      scheduleReveal();
    },
    [scheduleReveal, suppressed],
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  const value = useMemo(
    () => ({
      hidden: suppressed || hidden,
      suppressed,
      setSuppressed,
      onScroll,
      scrollEventThrottle: 16,
      reveal,
    }),
    [hidden, onScroll, reveal, setSuppressed, suppressed],
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
 * While mounted, hide the floating HomeTabBar completely (New request flow).
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
