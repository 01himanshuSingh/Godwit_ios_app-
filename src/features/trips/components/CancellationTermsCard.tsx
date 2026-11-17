import { StyleSheet, Text, View } from 'react-native';

import { activeTripType } from '@/features/trips/components/activeTripDetailTypography';
import { colors } from '@/ui/tokens/colors';

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
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
  },
  heading: {
    ...activeTripType.sectionHeading,
    color: colors.muted,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  body: {
    ...activeTripType.sectionBody,
    color: colors.forest,
  },
});
