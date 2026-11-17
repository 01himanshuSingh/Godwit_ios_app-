/**
 * Soft shimmer bone for Home loading skeletons.
 */
import { useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/ui/tokens/colors';

type SkeletonBoneProps = {
  style?: StyleProp<ViewStyle>;
};

export function SkeletonBone({ style }: SkeletonBoneProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.45, 0.9]),
  }));

  return <Animated.View style={[styles.bone, animatedStyle, style]} />;
}

const styles = StyleSheet.create({
  bone: {
    backgroundColor: colors.surface,
  },
});
