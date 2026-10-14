import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type CancellationTermsCardProps = {
  /** Paragraph from extractHotelCancellationTerms — hide when null/empty. */
  terms: string | null | undefined;
};

/**
 * CANCELLATION TERMS card — any Active Trip service.
 * Hidden when CRM has no cancellation policy text.
 */
export function CancellationTermsCard({ terms }: CancellationTermsCardProps) {
  const body = terms?.trim();
  if (!body) {
    return null;
  }

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.heading}>CANCELLATION TERMS</Text>
      <Text style={styles.body} selectable>
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#F8F7F5',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
  },
  heading: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.muted,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.forest,
  },
});
