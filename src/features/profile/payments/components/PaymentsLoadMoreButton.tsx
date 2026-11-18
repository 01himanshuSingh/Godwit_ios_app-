/**
 * Shared “Load more” control for Payments tab lists.
 */
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type PaymentsLoadMoreButtonProps = {
  label?: string;
  isFetching?: boolean;
  onPress?: () => void;
};

export function PaymentsLoadMoreButton({
  label = 'Load more',
  isFetching = false,
  onPress,
}: PaymentsLoadMoreButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isFetching ? 'Loading more' : label}
      disabled={isFetching || !onPress}
      onPress={onPress}
      style={styles.hit}
    >
      <View style={[styles.pill, isFetching && styles.pillBusy]}>
        {isFetching ? (
          <ActivityIndicator size="small" color={colors.forest} />
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    alignSelf: 'center',
    marginTop: 12,
  },
  pill: {
    minWidth: 120,
    minHeight: 40,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  pillBusy: {
    opacity: 0.85,
  },
  label: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    lineHeight: 15,
    color: colors.forest,
  },
});
