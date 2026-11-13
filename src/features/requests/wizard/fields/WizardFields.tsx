/**
 * Shared field primitives for New-request wizards.
 * Sizes match Hotel Stay tab via requestFormFieldChrome — same on every
 * service screen and Stay / Travellers / Notes / Review tab.
 */
import Feather from '@expo/vector-icons/Feather';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { CountStepper } from '@/features/requests/components/CountStepper';
import { FieldErrorText } from '@/features/requests/components/FieldErrorText';
import { requestFormFieldChrome } from '@/features/requests/shared/requestFormFieldChrome';
import { totalTravellers, type TravellerCounts } from '@/features/requests/shared/travellerCounts';
import type { WizardSummaryRow, WizardTabId } from '@/features/requests/wizard/types';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

export type WizardFieldChrome = ReturnType<typeof requestFormFieldChrome>;

export function useWizardFieldChrome(): WizardFieldChrome {
  const { width } = useWindowDimensions();
  return useMemo(() => requestFormFieldChrome(width), [width]);
}

/** Responsive field styles — prefer this over static wizardFieldStyles. */
export function useWizardFieldStyles() {
  const chrome = useWizardFieldChrome();
  return useMemo(() => createWizardFieldStyles(chrome), [chrome]);
}

export function createWizardFieldStyles(chrome: WizardFieldChrome) {
  return StyleSheet.create({
    stack: { gap: 14 },
    field: { gap: 6 },
    fieldHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {
      fontFamily: fontFamily.manrope.semibold,
      fontSize: chrome.labelSize,
      letterSpacing: chrome.labelLetter,
      textTransform: 'uppercase',
      color: colors.fieldLabel,
    },
    tagMuted: {
      fontFamily: fontFamily.manrope.medium,
      fontSize: chrome.labelSize,
      color: colors.muted,
    },
    helper: {
      fontFamily: fontFamily.manrope.regular,
      fontSize: chrome.helperSize,
      lineHeight: chrome.helperLineHeight,
      color: colors.muted,
    },
    input: {
      minHeight: chrome.inputHeight,
      borderRadius: chrome.inputRadius,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: chrome.inputPadH,
      paddingVertical: chrome.inputPadV,
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
    },
    inputRow: {
      minHeight: chrome.inputHeight,
      borderRadius: chrome.inputRadius,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: chrome.inputPadH,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#FFFFFF',
    },
    inputRowMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: chrome.inputHeight - 4,
    },
    clearBtn: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputValueFlex: { flex: 1 },
    inputValue: {
      fontFamily: fontFamily.manrope.regular,
      fontSize: chrome.inputSize,
      lineHeight: chrome.inputLineHeight,
      color: colors.forest,
    },
    inputPlaceholder: {
      fontFamily: fontFamily.manrope.regular,
      fontSize: chrome.inputSize,
      lineHeight: chrome.inputLineHeight,
      color: '#B5B1A8',
    },
    scheduleRow: {
      minHeight: chrome.scheduleMinHeight,
      borderRadius: chrome.inputRadius,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: chrome.inputPadH,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#FFFFFF',
    },
    scheduleHalf: { flex: 1, gap: 1 },
    scheduleArrow: {
      width: 28,
      alignItems: 'center',
    },
    miniLabel: {
      fontFamily: fontFamily.manrope.semibold,
      fontSize: 10,
      letterSpacing: 0.8,
      color: colors.muted,
    },
    arrow: { color: colors.muted, fontSize: 16 },
    nightsChip: {
      backgroundColor: '#E8F0E4',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    nightsChipText: {
      fontFamily: fontFamily.manrope.semibold,
      fontSize: chrome.helperSize,
      color: colors.accent,
    },
    optionalPill: {
      backgroundColor: colors.card,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    optionalPillText: {
      fontFamily: fontFamily.manrope.medium,
      fontSize: chrome.labelSize,
      color: colors.muted,
    },
    segmentRow: {
      flexDirection: 'row',
      gap: 8,
    },
    segment: {
      flex: 1,
      minHeight: chrome.inputHeight - 4,
      borderRadius: chrome.inputRadius,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
    },
    segmentSelected: {
      backgroundColor: colors.forest,
      borderColor: colors.forest,
    },
    segmentText: {
      fontFamily: fontFamily.manrope.medium,
      fontSize: chrome.inputSize - 1,
      color: colors.forest,
    },
    segmentTextSelected: {
      color: colors.sand,
    },
    travellerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    travellerTitle: {
      fontFamily: fontFamily.manrope.semibold,
      fontSize: chrome.inputSize,
      color: colors.forest,
    },
    childAgeCard: {
      backgroundColor: colors.card,
      borderRadius: chrome.inputRadius + 2,
      padding: 12,
      gap: 8,
    },
    childAgeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    ageChip: {
      minWidth: chrome.ageChip,
      height: chrome.ageChip,
      borderRadius: chrome.ageChip / 2,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
      backgroundColor: '#FFFFFF',
    },
    ageChipSelected: {
      backgroundColor: colors.forest,
      borderColor: colors.forest,
    },
    ageChipText: {
      fontFamily: fontFamily.manrope.semibold,
      fontSize: chrome.countValueSize,
      color: colors.forest,
    },
    ageChipTextSelected: { color: colors.sand },
    totalLine: {
      fontFamily: fontFamily.manrope.semibold,
      fontSize: chrome.inputSize - 1,
      color: colors.forest,
    },
    infoBox: {
      backgroundColor: colors.card,
      borderRadius: chrome.inputRadius,
      padding: 12,
    },
    infoText: {
      fontFamily: fontFamily.manrope.regular,
      fontSize: chrome.helperSize,
      lineHeight: chrome.helperLineHeight + 2,
      color: colors.muted,
    },
    notesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    textarea: {
      minHeight: chrome.textareaMinHeight,
      borderRadius: chrome.inputRadius,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: chrome.inputPadH,
      paddingVertical: chrome.inputPadV,
      fontFamily: fontFamily.manrope.regular,
      fontSize: chrome.inputSize,
      lineHeight: chrome.inputLineHeight,
      color: colors.forest,
      backgroundColor: '#FFFFFF',
    },
    quickAddLabel: {
      fontFamily: fontFamily.manrope.semibold,
      fontSize: chrome.labelSize,
      letterSpacing: 1,
      color: colors.muted,
    },
    chipRow: { gap: 8 },
    chip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 11,
      paddingVertical: 6,
      backgroundColor: '#FFFFFF',
      marginRight: 8,
    },
    chipSelected: {
      backgroundColor: colors.forest,
      borderColor: colors.forest,
    },
    chipText: {
      fontFamily: fontFamily.manrope.medium,
      fontSize: chrome.helperSize + 1,
      color: colors.forest,
    },
    chipTextSelected: { color: colors.sand },
    reviewRow: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    reviewValue: {
      marginTop: 4,
      fontFamily: fontFamily.manrope.semibold,
      fontSize: chrome.inputSize,
      color: colors.forest,
    },
    editLink: {
      fontFamily: fontFamily.manrope.semibold,
      fontSize: chrome.helperSize + 1,
      color: colors.accent,
    },
    reassure: {
      marginTop: 8,
      fontFamily: fontFamily.manrope.regular,
      fontStyle: 'italic',
      fontSize: chrome.helperSize + 1,
      lineHeight: chrome.helperLineHeight + 2,
      color: colors.muted,
      textAlign: 'center',
    },
    roomsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    roomsCopy: {
      flex: 1,
      minWidth: 0,
      paddingRight: 4,
      gap: 3,
    },
  });
}

/** @deprecated Use useWizardFieldStyles() for responsive Hotel Stay chrome. */
export const wizardFieldStyles = createWizardFieldStyles(requestFormFieldChrome(390));

export function FieldBlock({
  label,
  tag,
  tagRight,
  helper,
  error,
  children,
}: {
  label: string;
  tag?: string;
  tagRight?: ReactNode;
  helper?: string;
  error?: string;
  children: ReactNode;
}) {
  const styles = useWizardFieldStyles();
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.label}>{label}</Text>
        {tagRight}
        {tag ? <Text style={styles.tagMuted}>{tag}</Text> : null}
      </View>
      {children}
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      <FieldErrorText message={error} />
    </View>
  );
}

export function OptionalPill({ label = 'Optional' }: { label?: string }) {
  const styles = useWizardFieldStyles();
  return (
    <View style={styles.optionalPill}>
      <Text style={styles.optionalPillText}>{label}</Text>
    </View>
  );
}

export function TapField({
  value,
  placeholder,
  onPress,
}: {
  value: string;
  placeholder: string;
  onPress: () => void;
}) {
  const styles = useWizardFieldStyles();
  const chrome = useWizardFieldChrome();
  return (
    <Pressable style={styles.inputRow} onPress={onPress}>
      <Text
        style={[styles.inputValueFlex, value ? styles.inputValue : styles.inputPlaceholder]}
        numberOfLines={1}
      >
        {value || placeholder}
      </Text>
      <Feather name="chevron-down" size={chrome.iconSize} color={colors.muted} />
    </Pressable>
  );
}

export function IconTapField({
  value,
  placeholder,
  onPress,
  icon,
  onClear,
  clearAccessibilityLabel = 'Clear',
}: {
  value: string;
  placeholder: string;
  onPress: () => void;
  icon: React.ComponentProps<typeof Feather>['name'];
  onClear?: () => void;
  clearAccessibilityLabel?: string;
}) {
  const styles = useWizardFieldStyles();
  const chrome = useWizardFieldChrome();
  return (
    <View style={styles.inputRow}>
      <Pressable style={styles.inputRowMain} onPress={onPress} accessibilityLabel={placeholder}>
        <Feather name={icon} size={chrome.iconSize} color={colors.accent} />
        <Text
          style={[styles.inputValueFlex, value ? styles.inputValue : styles.inputPlaceholder]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
      </Pressable>
      {value && onClear ? (
        <Pressable
          hitSlop={10}
          onPress={onClear}
          accessibilityLabel={clearAccessibilityLabel}
          style={styles.clearBtn}
        >
          <Feather name="x" size={chrome.iconSize} color={colors.muted} />
        </Pressable>
      ) : (
        <Feather name="chevron-down" size={chrome.iconSize} color={colors.muted} />
      )}
    </View>
  );
}

export function ScheduleField({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  onPress,
  emptyLabel = 'Select',
  rightEmptyLabel,
}: {
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  onPress: () => void;
  emptyLabel?: string;
  rightEmptyLabel?: string;
}) {
  const styles = useWizardFieldStyles();
  return (
    <Pressable style={styles.scheduleRow} onPress={onPress}>
      <View style={styles.scheduleHalf}>
        <Text style={styles.miniLabel}>{leftLabel}</Text>
        <Text style={leftValue ? styles.inputValue : styles.inputPlaceholder} numberOfLines={1}>
          {leftValue || emptyLabel}
        </Text>
      </View>
      <View style={styles.scheduleArrow}>
        <Feather name="arrow-right" size={16} color={colors.muted} />
      </View>
      <View style={styles.scheduleHalf}>
        <Text style={styles.miniLabel}>{rightLabel}</Text>
        <Text style={rightValue ? styles.inputValue : styles.inputPlaceholder} numberOfLines={1}>
          {rightValue || rightEmptyLabel || emptyLabel}
        </Text>
      </View>
    </Pressable>
  );
}

export function CountFieldRow({
  label,
  helper,
  value,
  onChange,
  min = 0,
  max = 20,
  error,
  accessibilityLabel,
}: {
  label: string;
  helper?: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  error?: string;
  accessibilityLabel?: string;
}) {
  const styles = useWizardFieldStyles();
  return (
    <View>
      <View style={styles.roomsRow}>
        <View style={styles.roomsCopy}>
          <Text style={styles.label}>{label}</Text>
          {helper ? (
            <Text style={styles.helper} numberOfLines={1}>
              {helper}
            </Text>
          ) : null}
        </View>
        <CountStepper
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          accessibilityLabel={accessibilityLabel ?? label}
        />
      </View>
      <FieldErrorText message={error} />
    </View>
  );
}

export function SegmentedChoice({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const styles = useWizardFieldStyles();
  return (
    <View style={styles.segmentRow}>
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ChipPill({ text }: { text: string }) {
  const styles = useWizardFieldStyles();
  return (
    <View style={styles.nightsChip}>
      <Text style={styles.nightsChipText}>{text}</Text>
    </View>
  );
}

export function TravellersTabContent({
  counts,
  onChange,
  childAges,
  onChildAgeChange,
  showChildAges = false,
  error,
  infoText,
}: {
  counts: TravellerCounts;
  onChange: (next: TravellerCounts) => void;
  childAges?: number[];
  onChildAgeChange?: (index: number, age: number) => void;
  showChildAges?: boolean;
  error?: string;
  infoText?: string;
}) {
  const styles = useWizardFieldStyles();
  const pax = totalTravellers(counts);

  return (
    <View style={styles.stack}>
      {(
        [
          { key: 'adults' as const, title: 'Adults', helper: 'Ages 15 and above (min 1)', min: 1 },
          { key: 'children' as const, title: 'Children', helper: 'Ages 2–14', min: 0 },
          { key: 'infants' as const, title: 'Infants', helper: 'Under 2', min: 0 },
        ] as const
      ).map((row) => (
        <View key={row.key} style={styles.travellerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.travellerTitle}>{row.title}</Text>
            <Text style={styles.helper}>{row.helper}</Text>
          </View>
          <CountStepper
            value={counts[row.key]}
            min={row.min}
            max={20}
            onChange={(next) => onChange({ ...counts, [row.key]: next })}
          />
        </View>
      ))}

      {showChildAges && counts.children > 0
        ? Array.from({ length: counts.children }).map((_, index) => (
            <View key={`child-${index}`} style={styles.childAgeCard}>
              <View style={styles.childAgeHeader}>
                <Text style={styles.label}>CHILD {index + 1} AGE</Text>
                <Text style={styles.tagMuted}>Required</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {Array.from({ length: 13 }).map((__, ageIdx) => {
                  const age = ageIdx + 2;
                  const selected = childAges?.[index] === age;
                  return (
                    <Pressable
                      key={age}
                      onPress={() => onChildAgeChange?.(index, age)}
                      style={[styles.ageChip, selected && styles.ageChipSelected]}
                    >
                      <Text style={[styles.ageChipText, selected && styles.ageChipTextSelected]}>
                        {age}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Text style={styles.helper}>
                Required by luxury properties for bedding and amenities.
              </Text>
            </View>
          ))
        : null}

      <Text style={styles.totalLine}>
        Total travellers: {pax} traveller{pax === 1 ? '' : 's'}
      </Text>
      <FieldErrorText message={error} />
      {infoText ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{infoText}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function NotesTabContent({
  notes,
  onChangeNotes,
  chips,
  chipOptions,
  onToggleChip,
  infoText,
  required,
  error,
}: {
  notes: string;
  onChangeNotes: (next: string) => void;
  chips?: string[];
  chipOptions?: readonly string[];
  onToggleChip?: (chip: string) => void;
  infoText?: string;
  required?: boolean;
  error?: string;
}) {
  const styles = useWizardFieldStyles();
  return (
    <View style={styles.stack}>
      <View style={styles.notesHeader}>
        <Text style={styles.label}>ANYTHING WE SHOULD KNOW?</Text>
        <Text style={styles.tagMuted}>{required ? 'REQUIRED' : 'OPTIONAL'}</Text>
      </View>
      <TextInput
        value={notes}
        onChangeText={onChangeNotes}
        placeholder="Preferences, occasions…"
        placeholderTextColor="#B5B1A8"
        multiline
        style={styles.textarea}
        textAlignVertical="top"
      />
      <FieldErrorText message={error} />
      {chipOptions && onToggleChip ? (
        <>
          <Text style={styles.quickAddLabel}>QUICK ADD</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {chipOptions.map((chip) => {
              const selected = chips?.includes(chip);
              return (
                <Pressable
                  key={chip}
                  onPress={() => onToggleChip(chip)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {selected ? `✓ ${chip}` : `+ ${chip}`}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : null}
      {infoText ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{infoText}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function ReviewTabContent({
  rows,
  onEdit,
}: {
  rows: WizardSummaryRow[];
  onEdit: (tab: WizardTabId) => void;
}) {
  const styles = useWizardFieldStyles();
  return (
    <View style={styles.stack}>
      {rows.map((row) => (
        <View key={row.id} style={styles.reviewRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.reviewValue}>{row.value || '—'}</Text>
          </View>
          <Pressable
            onPress={() =>
              onEdit(
                row.id.includes('traveller') ||
                  row.id.includes('guest') ||
                  row.id.includes('passenger')
                  ? 'travellers'
                  : row.id.includes('note') || row.id.includes('request')
                    ? 'notes'
                    : 'details',
              )
            }
          >
            <Text style={styles.editLink}>Edit</Text>
          </Pressable>
        </View>
      ))}
      <Text style={styles.reassure}>
        Your concierge will respond with curated options. Nothing is booked yet.
      </Text>
    </View>
  );
}

/** Utility for rare one-off style merges in service wizards. */
export type WizardFieldStyleSheet = ReturnType<typeof createWizardFieldStyles>;
export type WizardFieldViewStyle = StyleProp<ViewStyle>;
export type WizardFieldTextStyle = StyleProp<TextStyle>;
