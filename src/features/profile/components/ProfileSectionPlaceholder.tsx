/**
 * Temporary body for Profile sections until each feature is wired to CRM/BFF.
 */
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type ProfileSectionPlaceholderProps = {
  message?: string;
};

export function ProfileSectionPlaceholder({
  message = 'This section is ready for its own UI. Data wiring comes next.',
}: ProfileSectionPlaceholderProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: '#F8F7F4',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  text: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
  },
});
