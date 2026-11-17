import Feather from '@expo/vector-icons/Feather';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { homeContentInset } from '@/features/home/layout/homeContentInset';
import type { HomeViewModel } from '@/features/home/schemas/homeViewModel';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type GreetingSectionProps = Pick<HomeViewModel, 'familyName' | 'greeting' | 'userName'> & {
  /** Omit until live updates exist — never invent a count. */
  updatesCount?: number | null;
  onPressUpdates?: () => void;
};

export function GreetingSection({
  familyName,
  greeting,
  userName,
  updatesCount,
  onPressUpdates,
}: GreetingSectionProps) {
  const { width } = useWindowDimensions();
  const inset = useMemo(() => homeContentInset(width), [width]);
  const showUpdates = typeof updatesCount === 'number' && updatesCount >= 0;
  const updatesLabel = updatesCount === 1 ? '1 new update' : `${updatesCount ?? 0} new updates`;

  return (
    <View style={[styles.container, { paddingHorizontal: inset }]}>
      <Text style={styles.eyebrow}>{familyName}</Text>
      <View style={styles.headingRow} accessibilityRole="header">
        <Text style={styles.headingFixed} numberOfLines={1}>
          {greeting},{'\u00A0'}
        </Text>
        <Text style={styles.headingName} numberOfLines={1} ellipsizeMode="tail">
          {userName}
        </Text>
      </View>
      {showUpdates ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={updatesLabel}
          onPress={onPressUpdates}
          disabled={!onPressUpdates}
          hitSlop={6}
          style={styles.pressable}
        >
          <View style={styles.updatesRow}>
            <Text style={styles.updates}>{updatesLabel}</Text>
            <Feather name="chevron-right" size={14} color={colors.muted} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 22,
    gap: 6,
  },
  eyebrow: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 10,
    letterSpacing: 10 * 0.16,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    width: '100%',
    minWidth: 0,
  },
  headingFixed: {
    flexShrink: 0,
    fontFamily: fontFamily.cormorant.regular,
    fontSize: 26,
    lineHeight: 32,
    color: colors.forest,
  },
  headingName: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontFamily: fontFamily.cormorant.regular,
    fontSize: 26,
    lineHeight: 32,
    color: colors.forest,
  },
  pressable: {
    alignSelf: 'flex-start',
  },
  updatesRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  updates: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 14,
    color: colors.muted,
  },
});
