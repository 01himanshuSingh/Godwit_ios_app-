import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { homeContentInset } from '@/features/home/layout/homeContentInset';
import type { HomeViewModel } from '@/features/home/schemas/homeViewModel';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type GreetingSectionProps = Pick<
  HomeViewModel,
  'familyName' | 'greeting' | 'userName' | 'updatesCount'
>;

export function GreetingSection({
  familyName,
  greeting,
  userName,
  updatesCount,
}: GreetingSectionProps) {
  const { width } = useWindowDimensions();
  const inset = useMemo(() => homeContentInset(width), [width]);
  const updatesLabel = updatesCount === 1 ? '1 new update' : `${updatesCount} new updates`;

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
      <Text style={styles.updates}>{updatesLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 28,
    gap: 6,
  },
  eyebrow: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 11 * 0.16,
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
    fontFamily: fontFamily.cormorant.light,
    fontSize: 30,
    lineHeight: 36,
    color: colors.forest,
  },
  headingName: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontFamily: fontFamily.cormorant.light,
    fontSize: 30,
    lineHeight: 36,
    color: colors.forest,
  },
  updates: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
});
