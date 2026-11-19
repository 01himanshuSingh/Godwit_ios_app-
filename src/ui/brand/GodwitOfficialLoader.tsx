/**
 * Official Godwit circular loader — bird-on-key mark + sweeping ring.
 * Use for Home start load and other in-app waiting states.
 */
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

import { GODWIT_MARK_CIRCLE } from '@/ui/brand/godwitBrandAssets';
import { useGodwitFonts } from '@/ui/fonts/useGodwitFonts';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

const RING_SIZE = 156;
const RING_STROKE = 1.75;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_ARC = RING_CIRCUMFERENCE * 0.28;

type GodwitOfficialLoaderProps = {
  /** `screen` fills parent; `inline` sizes to the mark. */
  variant?: 'screen' | 'inline';
  /** Show GODWIT wordmark under the ring. */
  showBrand?: boolean;
  accessibilityLabel?: string;
};

export function GodwitOfficialLoader({
  variant = 'screen',
  showBrand = true,
  accessibilityLabel = 'Loading Godwit',
}: GodwitOfficialLoaderProps) {
  const fontsLoaded = useGodwitFonts();
  const enter = useSharedValue(0);
  const breath = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    enter.value = withTiming(1, {
      duration: 720,
      easing: Easing.out(Easing.cubic),
    });
    breath.value = withDelay(
      360,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    spin.value = withDelay(
      240,
      withRepeat(withTiming(1, { duration: 1400, easing: Easing.linear }), -1, false),
    );
  }, [breath, enter, spin]);

  const stageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(enter.value, [0, 1], [0, 1]),
    transform: [
      { translateY: interpolate(enter.value, [0, 1], [12, 0]) },
      { scale: interpolate(enter.value, [0, 0.8, 1], [0.92, 1.01, 1]) },
    ],
  }));

  const markStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(breath.value, [0, 1], [0, -3]) },
      { scale: interpolate(breath.value, [0, 1], [1, 1.02]) },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breath.value, [0, 1], [0.22, 0.4]),
    transform: [{ scale: interpolate(breath.value, [0, 1], [0.94, 1.08]) }],
  }));

  const ringSpinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(spin.value, [0, 1], [-90, 270])}deg` }],
  }));

  const copyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(enter.value, [0.4, 1], [0, 1]),
    transform: [{ translateY: interpolate(enter.value, [0.4, 1], [8, 0]) }],
  }));

  return (
    <View
      style={[styles.root, variant === 'screen' && styles.rootScreen]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[styles.stage, stageStyle]}>
        <Animated.View style={[styles.glow, glowStyle]} />

        <View style={styles.plate}>
          <Animated.View style={markStyle}>
            <Image
              source={GODWIT_MARK_CIRCLE}
              style={styles.mark}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </Animated.View>
        </View>

        <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ringSvg} pointerEvents="none">
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke="rgba(216, 205, 184, 0.16)"
            strokeWidth={RING_STROKE}
            fill="none"
          />
        </Svg>

        <Animated.View style={[styles.ringSvg, ringSpinStyle]} pointerEvents="none">
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={colors.sand}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${RING_ARC} ${RING_CIRCUMFERENCE}`}
            />
          </Svg>
        </Animated.View>
      </Animated.View>

      {showBrand ? (
        <Animated.View style={[styles.copy, copyStyle]}>
          {fontsLoaded ? (
            <>
              <Text style={styles.brand}>G O D W I T</Text>
              <Text style={styles.tagline}>Private travel management</Text>
            </>
          ) : (
            <View style={styles.copySpacer} />
          )}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  rootScreen: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background,
  },
  stage: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: '#2A2620',
  },
  plate: {
    width: 118,
    height: 118,
    borderRadius: 59,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#141210',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(216, 205, 184, 0.14)',
  },
  mark: {
    width: 84,
    height: 84,
  },
  ringSvg: {
    ...StyleSheet.absoluteFill,
  },
  copy: {
    marginTop: 28,
    alignItems: 'center',
    gap: 8,
  },
  copySpacer: {
    height: 42,
  },
  brand: {
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 20,
    letterSpacing: 5.5,
    color: colors.forest,
  },
  tagline: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.muted,
  },
});
