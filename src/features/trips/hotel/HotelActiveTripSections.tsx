import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { GodwitBenefit } from '@/lib/firebase/sales/getActiveTripDetail';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type SectionCardProps = {
  heading: string;
  children: ReactNode;
};

function SectionCard({ heading, children }: SectionCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{heading}</Text>
      {children}
    </View>
  );
}

type SpecialRequestsCardProps = {
  lines: string[];
};

export function SpecialRequestsCard({ lines }: SpecialRequestsCardProps) {
  if (!lines.length) {
    return null;
  }
  return (
    <SectionCard heading="SPECIAL REQUESTS">
      <View style={styles.listBlock}>
        {lines.map((line) => (
          <Text key={line} style={styles.body} selectable>
            {line}
          </Text>
        ))}
      </View>
    </SectionCard>
  );
}

type GodwitBenefitsCardProps = {
  benefits: GodwitBenefit[] | null | undefined;
};

/**
 * "YOUR GODWIT BENEFITS" — hotel Active Trip only.
 * Hidden when partnership / sale has no benefit lines.
 */
export function GodwitBenefitsCard({ benefits }: GodwitBenefitsCardProps) {
  const lines = (benefits ?? []).filter((b) => b.title?.trim());
  if (!lines.length) {
    return null;
  }

  return (
    <View style={styles.benefitsCardShell} accessibilityRole="summary">
      <Text style={styles.benefitsHeading}>YOUR GODWIT BENEFITS</Text>
      <View style={styles.benefitsList}>
        {lines.map((b, index) => {
          const title = b.title.trim();
          const note = b.note?.trim() || null;
          return (
            <View key={`${title}-${note ?? ''}-${index}`} style={styles.benefitRow}>
              <Text style={styles.bullet}>{'\u2022'}</Text>
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle} selectable>
                  {title}
                </Text>
                {note ? (
                  <Text style={styles.benefitNote} selectable>
                    {note}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    width: '100%',
    marginTop: 12,
  },
  heading: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.muted,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  listBlock: {
    gap: 8,
  },
  body: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.forest,
  },
  /** Soft sand card matching hotel benefits mock. */
  benefitsCardShell: {
    width: '100%',
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#F2F1ED',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  benefitsHeading: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.muted,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  benefitsList: {
    gap: 14,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.forest,
    width: 12,
    marginTop: 0,
  },
  benefitText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  benefitTitle: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.forest,
  },
  benefitNote: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
});
