/**
 * Expandable Personal Details card — only renders fields present on the view model.
 * Visual styles on View; Pressable is a plain touch wrapper.
 */
import Feather from '@expo/vector-icons/Feather';
import { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';

import type { TravellerPersonalDetails } from '@/lib/firebase/customers';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type PersonalDetailsCardProps = {
  details: TravellerPersonalDetails;
  initiallyExpanded?: boolean;
};

type DetailField = {
  key: string;
  label: string;
  value: string;
};

function buildFields(details: TravellerPersonalDetails): DetailField[] {
  const rows: { key: string; label: string; value: string | null }[] = [
    { key: 'fullName', label: 'FULL NAME', value: details.fullName },
    { key: 'dob', label: 'DATE OF BIRTH', value: details.dateOfBirthLabel },
    { key: 'nationality', label: 'NATIONALITY', value: details.nationality },
    { key: 'relationship', label: 'RELATIONSHIP', value: details.relationship },
    { key: 'email', label: 'EMAIL', value: details.email },
    { key: 'telephone', label: 'TELEPHONE', value: details.telephone },
  ];
  return rows
    .filter((r): r is DetailField => Boolean(r.value?.trim()))
    .map((r) => ({ key: r.key, label: r.label, value: r.value!.trim() }));
}

export function PersonalDetailsCard({
  details,
  initiallyExpanded = true,
}: PersonalDetailsCardProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const fields = useMemo(() => buildFields(details), [details]);

  const summary =
    details.summaryLine?.trim() ||
    [details.nationality, details.dateOfBirthLabel ? `born ${details.dateOfBirthLabel}` : null]
      .filter(Boolean)
      .join(' · ') ||
    null;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="Personal details"
        onPress={toggle}
        hitSlop={8}
        style={styles.headerPressable}
      >
        <View style={styles.headerTop}>
          <Text style={styles.sectionLabel}>PERSONAL DETAILS</Text>
          <View style={styles.headerTrailing}>
            <View style={styles.managedBadge}>
              <Feather name="lock" size={9} color={colors.forest} />
              <Text style={styles.managedLabel}>Managed by Godwit</Text>
            </View>
            <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#C4C0B8" />
          </View>
        </View>

        {summary ? (
          <Text style={styles.summary} numberOfLines={2} ellipsizeMode="tail">
            {summary}
          </Text>
        ) : null}
      </Pressable>

      {expanded ? (
        <>
          <View style={styles.divider} />
          <View style={styles.fields}>
            {fields.length === 0 ? (
              <Text style={styles.empty}>No personal details available yet.</Text>
            ) : (
              fields.map((field) => (
                <View key={field.key} style={styles.field}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <Text style={styles.fieldValue} selectable>
                    {field.value}
                  </Text>
                </View>
              ))
            )}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerPressable: {
    width: '100%',
    gap: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 10,
    letterSpacing: 0.9,
    color: colors.muted,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  headerTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  managedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: colors.sand,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  managedLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 9,
    lineHeight: 11,
    color: colors.forest,
  },
  summary: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: 14,
    marginBottom: 14,
  },
  fields: {
    width: '100%',
    gap: 14,
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 9,
    letterSpacing: 0.8,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.forest,
  },
  empty: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 10,
    color: colors.muted,
  },
});
