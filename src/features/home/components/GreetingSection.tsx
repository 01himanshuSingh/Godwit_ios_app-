import { StyleSheet, Text, View } from 'react-native';

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
  const updatesLabel = updatesCount === 1 ? '1 new update' : `${updatesCount} new updates`;

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{familyName}</Text>
      <Text style={styles.heading} accessibilityRole="header">
        {greeting}, {userName}
      </Text>
      <Text style={styles.updates}>{updatesLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
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
  heading: {
    fontFamily: fontFamily.cormorant.light,
    fontSize: 36,
    lineHeight: 42,
    color: colors.forest,
    marginTop: 4,
  },
  updates: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
});
