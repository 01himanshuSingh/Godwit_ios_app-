/**
 * Expandable Personal Details card — collapsed summary + field list.
 * Matches traveller detail mock (open / closed chevron).
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
  useWindowDimensions,
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
  /** Start expanded (mock default is open). */
  initiallyExpanded?: boolean;
};

type DetailField = {
  key: string;
  label: string;
  value: string;
};

function layoutForWidth(width: number) {
  if (width < 360) {
    return {
      padH: 18,
      padV: 16,
      radius: 18,
      sectionLabelSize: 11,
      summarySize: 14,
      summaryLineHeight: 20,
      fieldLabelSize: 11,
      fieldValueSize: 15,
      fieldValueLineHeight: 20,
      fieldGap: 16,
      chevronSize: 18,
    };
  }
  return {
    padH: 22,
    padV: 18,
    radius: 20,
    sectionLabelSize: 11,
    summarySize: 15,
    summaryLineHeight: 22,
    fieldLabelSize: 11,
    fieldValueSize: 16,
    fieldValueLineHeight: 22,
    fieldGap: 18,
    chevronSize: 20,
  };
}

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
    .filter((r): r is DetailField => Boolean(r.value))
    .map((r) => ({ key: r.key, label: r.label, value: r.value as string }));
}

export function PersonalDetailsCard({
  details,
  initiallyExpanded = true,
}: PersonalDetailsCardProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const fields = useMemo(() => buildFields(details), [details]);

  const summary =
    details.summaryLine ||
    [details.nationality, details.relationship].filter(Boolean).join(' · ') ||
    'Personal details';

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: layout.radius,
          paddingHorizontal: layout.padH,
          paddingTop: layout.padV,
          paddingBottom: layout.padV,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="Personal details"
        onPress={toggle}
        style={({ pressed }) => [styles.headerRow, pressed && styles.pressed]}
      >
        <View style={styles.headerText}>
          <Text
            style={[styles.sectionLabel, { fontSize: layout.sectionLabelSize, letterSpacing: 0.8 }]}
          >
            PERSONAL DETAILS
          </Text>
          <Text
            style={[
              styles.summary,
              {
                fontSize: layout.summarySize,
                lineHeight: layout.summaryLineHeight,
              },
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {summary}
          </Text>
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={layout.chevronSize}
          color="#C4C0B8"
        />
      </Pressable>

      {expanded ? (
        <>
          <View style={styles.divider} />
          <View style={[styles.fields, { gap: layout.fieldGap }]}>
            {fields.length === 0 ? (
              <Text style={styles.empty}>No personal details available yet.</Text>
            ) : (
              fields.map((field) => (
                <View key={field.key} style={styles.field}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { fontSize: layout.fieldLabelSize, letterSpacing: 0.7 },
                    ]}
                  >
                    {field.label}
                  </Text>
                  <Text
                    style={[
                      styles.fieldValue,
                      {
                        fontSize: layout.fieldValueSize,
                        lineHeight: layout.fieldValueLineHeight,
                      },
                    ]}
                    selectable
                  >
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
    backgroundColor: '#F8F7F4',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  sectionLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  summary: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.forest,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: 16,
    marginBottom: 16,
  },
  fields: {
    width: '100%',
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.forest,
  },
  empty: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    color: colors.muted,
  },
  pressed: {
    opacity: 0.75,
  },
});
