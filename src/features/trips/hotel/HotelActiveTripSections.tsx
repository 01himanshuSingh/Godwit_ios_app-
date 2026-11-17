/**
 * Hotel Active Trip lower cards — special requests + Godwit benefits.
 * Hidden when backend arrays are empty.
 */
import Feather from '@expo/vector-icons/Feather';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { activeTripType } from '@/features/trips/components/activeTripDetailTypography';
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
  const items = lines.map((l) => l.trim()).filter(Boolean);
  if (!items.length) {
    return null;
  }
  return (
    <SectionCard heading="SPECIAL REQUESTS">
      <View style={styles.listBlock}>
        {items.map((line) => (
          <View key={line} style={styles.bulletRow}>
            <Text style={styles.bullet}>{'\u2022'}</Text>
            <Text style={styles.body} selectable>
              {line}
            </Text>
          </View>
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
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.heading}>YOUR GODWIT BENEFITS</Text>
      <View style={styles.listBlock}>
        {lines.map((b, index) => {
          const title = b.title.trim();
          const note = b.note?.trim() || null;
          return (
            <View key={`${title}-${note ?? ''}-${index}`} style={styles.benefitRow}>
              <Feather name="star" size={16} color={colors.forest} style={styles.star} />
              <View style={styles.benefitText}>
                <Text style={styles.benefitBody} selectable>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    width: '100%',
  },
  heading: {
    ...activeTripType.sectionHeading,
    color: colors.muted,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  listBlock: {
    gap: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 12,
    lineHeight: 22,
    color: colors.forest,
    width: 12,
  },
  body: {
    ...activeTripType.sectionBody,
    flex: 1,
    minWidth: 0,
    color: colors.forest,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  star: {
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  benefitBody: {
    ...activeTripType.sectionBody,
    lineHeight: 21,
    color: colors.forest,
  },
  benefitNote: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
});
