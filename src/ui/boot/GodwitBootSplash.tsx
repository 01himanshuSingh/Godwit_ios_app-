/**
 * Cold-start Godwit boot splash.
 * Native splash → circular brand loader → fade into app.
 */
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { GodwitBirdMark, type GodwitBirdVariant } from '@/ui/brand/GodwitBirdMark';
import { GODWIT_MARK_CIRCLE, type GodwitBootMode } from '@/ui/brand/godwitBrandAssets';
import { useGodwitFonts } from '@/ui/fonts/useGodwitFonts';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Already prevented / unavailable in some environments.
});

const RING_SIZE = 168;
const RING_STROKE = 1.75;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
/** Visible arc length as a fraction of the full ring. */
const RING_ARC = RING_CIRCUMFERENCE * 0.28;

/** Pose-tuned breath so each A/B mark option reads with the right energy. */
const MOTION_BY_VARIANT: Record<
  GodwitBirdVariant,
  { lift: number; scale: number; tilt: number; cycleMs: number }
> = {
  standing: { lift: 3, scale: 1.025, tilt: 0, cycleMs: 1700 },
  flight: { lift: 6, scale: 1.04, tilt: 1.5, cycleMs: 1100 },
  wading: { lift: 2, scale: 1.015, tilt: 0, cycleMs: 2000 },
  abstract: { lift: 3, scale: 1.03, tilt: 0, cycleMs: 1500 },
  takeoff: { lift: 5, scale: 1.035, tilt: 1.2, cycleMs: 900 },
};

const LOCKUP_MOTION = { lift: 3, scale: 1.02, tilt: 0, cycleMs: 1800 };

type GodwitBootSplashProps = {
  exiting?: boolean;
  onExited?: () => void;
  birdVariant?: GodwitBirdVariant;
  /** `mark` = SVG bird; `lockup` = official website bird-on-key. */
  mode?: GodwitBootMode;
  previewOnly?: boolean;
};

export function GodwitBootSplash({
  exiting = false,
  onExited,
  birdVariant = 'standing',
  mode = 'mark',
  previewOnly = false,
}: GodwitBootSplashProps) {
  const fontsLoaded = useGodwitFonts();
  const enter = useSharedValue(0);
  const breath = useSharedValue(0);
  const exit = useSharedValue(0);
  const spin = useSharedValue(0);

  const isLockup = mode === 'lockup';
  const motion = isLockup ? LOCKUP_MOTION : MOTION_BY_VARIANT[birdVariant];
  const ringTrack = isLockup ? 'rgba(216, 205, 184, 0.16)' : 'rgba(27, 41, 21, 0.12)';
  const ringActive = isLockup ? colors.sand : colors.forest;
  const plateBg = isLockup ? '#141210' : '#F4F2EE';
  const markColor = isLockup ? colors.sand : colors.forest;

  useEffect(() => {
    enter.value = 0;
    breath.value = 0;
    spin.value = 0;
    enter.value = withTiming(1, {
      duration: 780,
      easing: Easing.out(Easing.cubic),
    });
    breath.value = withDelay(
      360,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: motion.cycleMs,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: motion.cycleMs,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
    spin.value = withDelay(
      280,
      withRepeat(withTiming(1, { duration: 1400, easing: Easing.linear }), -1, false),
    );

    if (previewOnly) return;

    const hide = requestAnimationFrame(() => {
      void SplashScreen.hideAsync().catch(() => undefined);
    });
    return () => cancelAnimationFrame(hide);
  }, [birdVariant, breath, enter, motion.cycleMs, previewOnly, spin]);

  useEffect(() => {
    if (!exiting) return;
    exit.value = withTiming(1, {
      duration: 420,
      easing: Easing.in(Easing.cubic),
    });
    const t = setTimeout(() => onExited?.(), 440);
    return () => clearTimeout(t);
  }, [exiting, exit, onExited]);

  const rootStyle = useAnimatedStyle(() => ({
    opacity: interpolate(exit.value, [0, 1], [1, 0]),
    transform: [{ scale: interpolate(exit.value, [0, 1], [1, 1.02]) }],
  }));

  const stageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(enter.value, [0, 1], [0, 1]),
    transform: [
      { translateY: interpolate(enter.value, [0, 1], [16, 0]) },
      { scale: interpolate(enter.value, [0, 0.75, 1], [0.9, 1.01, 1]) },
    ],
  }));

  const markStyle = useAnimatedStyle(() => {
    const lift = interpolate(breath.value, [0, 1], [0, -motion.lift]);
    const scale = interpolate(breath.value, [0, 1], [1, motion.scale]);
    const tilt = interpolate(breath.value, [0, 1], [-motion.tilt, motion.tilt]);
    return {
      transform: [{ translateY: lift }, { scale }, { rotate: `${tilt}deg` }],
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breath.value, [0, 1], [0.28, 0.5]),
    transform: [{ scale: interpolate(breath.value, [0, 1], [0.94, 1.08]) }],
  }));

  const ringSpinStyle = useAnimatedStyle(() => ({
    // -90 so the arc begins at 12 o'clock.
    transform: [{ rotate: `${interpolate(spin.value, [0, 1], [-90, 270])}deg` }],
  }));

  const copyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(enter.value, [0.42, 1], [0, 1]),
    transform: [{ translateY: interpolate(enter.value, [0.42, 1], [10, 0]) }],
  }));

  return (
    <Animated.View
      style={[styles.root, isLockup && styles.rootLockup, rootStyle]}
      pointerEvents={exiting ? 'none' : 'auto'}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading Godwit"
    >
      <View style={[styles.atmosphere, isLockup && styles.atmosphereLockup]} />

      <Animated.View style={[styles.stage, stageStyle]}>
        <Animated.View style={[styles.glow, isLockup && styles.glowLockup, glowStyle]} />

        <View style={[styles.plate, { backgroundColor: plateBg }, isLockup && styles.plateLockup]}>
          <Animated.View style={markStyle}>
            {isLockup ? (
              <Image
                source={GODWIT_MARK_CIRCLE}
                style={styles.lockupMark}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            ) : (
              <GodwitBirdMark size={78} color={markColor} variant={birdVariant} />
            )}
          </Animated.View>
        </View>

        {/* Static track */}
        <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ringSvg} pointerEvents="none">
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={ringTrack}
            strokeWidth={RING_STROKE}
            fill="none"
          />
        </Svg>

        {/* Sweeping arc */}
        <Animated.View style={[styles.ringSvg, ringSpinStyle]} pointerEvents="none">
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={ringActive}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${RING_ARC} ${RING_CIRCUMFERENCE}`}
            />
          </Svg>
        </Animated.View>
      </Animated.View>

      {fontsLoaded ? (
        <Animated.View style={[styles.copy, copyStyle]}>
          <Text style={[styles.brand, isLockup && styles.brandLockup]}>G O D W I T</Text>
          <Text style={[styles.tagline, isLockup && styles.taglineLockup]}>
            Private travel management
          </Text>
        </Animated.View>
      ) : (
        <View style={styles.copySpacer} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 32,
  },
  rootLockup: {
    backgroundColor: '#0A0A0A',
  },
  atmosphere: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.background,
  },
  atmosphereLockup: {
    backgroundColor: '#0A0A0A',
  },
  stage: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  glow: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: colors.sand,
  },
  glowLockup: {
    backgroundColor: '#2A2620',
  },
  plate: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  plateLockup: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(216, 205, 184, 0.14)',
  },
  lockupMark: {
    width: 92,
    height: 92,
  },
  ringSvg: {
    ...StyleSheet.absoluteFill,
  },
  copy: {
    marginTop: 32,
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
  },
  copySpacer: {
    marginTop: 32,
    height: 42,
  },
  brand: {
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 22,
    letterSpacing: 6,
    color: colors.forest,
  },
  brandLockup: {
    color: colors.sand,
  },
  tagline: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.4,
    color: colors.muted,
  },
  taglineLockup: {
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(216, 205, 184, 0.72)',
  },
});
