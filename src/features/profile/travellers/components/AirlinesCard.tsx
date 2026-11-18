/**
 * Expandable Commercial Airlines prefs card — same edit UX as Hotels.
 * CRM fields only: preferredAirlines, specialMeal, seatPreference, airportVipRequirement.
 */
import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';

import type { TravellerAirlinePrefField, TravellerAirlinePrefs } from '@/lib/firebase/customers';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type AirlinesCardProps = {
  airlinePrefs: TravellerAirlinePrefs;
  initiallyExpanded?: boolean;
  savingField?: TravellerAirlinePrefField | null;
  onSaveField?: (field: TravellerAirlinePrefField, value: string) => void | Promise<void>;
};

const FIELD_VALUE: Record<
  TravellerAirlinePrefField,
  (prefs: TravellerAirlinePrefs) => string | null
> = {
  preferredAirlines: (p) => p.preferredAirlines,
  specialMeal: (p) => p.specialMeal,
  seatPreference: (p) => p.seatPreference,
  airportVipRequirement: (p) => p.airportVipRequirement,
};

const EDITABLE_ROWS: { field: TravellerAirlinePrefField; label: string }[] = [
  { field: 'preferredAirlines', label: 'PREFERRED AIRLINES' },
  { field: 'specialMeal', label: 'SPECIAL MEAL' },
  { field: 'seatPreference', label: 'SEAT PREFERENCE' },
  { field: 'airportVipRequirement', label: 'AIRPORT VIP REQUIREMENT' },
];

function PrefRow({
  field,
  label,
  value,
  editing,
  draft,
  saving,
  canStartEdit,
  onChangeDraft,
  onStartEdit,
  onSave,
  onCancel,
}: {
  field: TravellerAirlinePrefField;
  label: string;
  value: string | null;
  editing: boolean;
  draft: string;
  saving: boolean;
  canStartEdit: boolean;
  onChangeDraft: (text: string) => void;
  onStartEdit: (field: TravellerAirlinePrefField) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (editing) {
    return (
      <View style={styles.prefRow}>
        <View style={styles.prefHeader}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <View style={styles.editingBadge}>
            <View style={styles.editingDot} />
            <Text style={styles.editingLabel}>Editing</Text>
          </View>
        </View>

        <TextInput
          value={draft}
          onChangeText={onChangeDraft}
          editable={!saving}
          autoFocus
          multiline={false}
          returnKeyType="done"
          onSubmitEditing={onSave}
          placeholder="Enter value"
          placeholderTextColor={colors.muted}
          style={styles.input}
          accessibilityLabel={label}
        />

        <View style={styles.actions}>
          <View style={[styles.saveBtn, saving && styles.saveBtnDisabled]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save"
              disabled={saving}
              onPress={onSave}
              style={({ pressed }) => [styles.savePressable, pressed && styles.savePressed]}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.sand} />
              ) : (
                <Text style={styles.saveLabel}>Save</Text>
              )}
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            disabled={saving}
            onPress={onCancel}
            hitSlop={8}
            style={({ pressed }) => [styles.cancelHit, pressed && styles.pressed]}
          >
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const display = value?.trim() || null;

  return (
    <View style={styles.prefRow}>
      <View style={styles.prefHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {canStartEdit ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${label}`}
            onPress={() => onStartEdit(field)}
            hitSlop={8}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.editLabel}>Edit</Text>
          </Pressable>
        ) : null}
      </View>
      <Text
        style={[styles.fieldValue, !display && styles.fieldValueEmpty]}
        selectable={Boolean(display)}
      >
        {display || 'Not set'}
      </Text>
    </View>
  );
}

export function AirlinesCard({
  airlinePrefs,
  initiallyExpanded = true,
  savingField = null,
  onSaveField,
}: AirlinesCardProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [editingField, setEditingField] = useState<TravellerAirlinePrefField | null>(null);
  const [draft, setDraft] = useState('');

  const summary =
    airlinePrefs.summaryLine?.trim() ||
    [
      airlinePrefs.preferredAirlines,
      airlinePrefs.preferredClass,
      airlinePrefs.seatPreference,
      airlinePrefs.specialMeal,
    ]
      .map((v) => v?.trim())
      .filter(Boolean)
      .join(' · ') ||
    null;

  const toggle = () => {
    if (editingField) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const startEdit = (field: TravellerAirlinePrefField) => {
    if (!onSaveField || savingField) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditingField(field);
    setDraft(FIELD_VALUE[field](airlinePrefs) ?? '');
  };

  const cancelEdit = () => {
    if (savingField) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditingField(null);
    setDraft('');
  };

  const saveEdit = async () => {
    if (!editingField || !onSaveField || savingField) return;
    try {
      await onSaveField(editingField, draft);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setEditingField(null);
      setDraft('');
    } catch {
      // Keep edit mode open so the user can retry.
    }
  };

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="Commercial airlines"
        onPress={toggle}
        hitSlop={8}
        style={styles.headerPressable}
      >
        <View style={styles.headerTop}>
          <Text style={styles.sectionLabel}>COMMERCIAL AIRLINES</Text>
          <View style={styles.headerTrailing}>
            {onSaveField ? (
              <View style={styles.editBadge}>
                <Feather name="edit-2" size={9} color={colors.forest} />
                <Text style={styles.editBadgeLabel}>You can edit</Text>
              </View>
            ) : null}
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
        <View style={styles.body}>
          {EDITABLE_ROWS.map((row, index) => (
            <View key={row.field}>
              {index > 0 ? <View style={styles.rowDivider} /> : null}
              <PrefRow
                field={row.field}
                label={row.label}
                value={FIELD_VALUE[row.field](airlinePrefs)}
                editing={editingField === row.field}
                draft={draft}
                saving={savingField === row.field}
                canStartEdit={Boolean(onSaveField) && editingField === null}
                onChangeDraft={setDraft}
                onStartEdit={startEdit}
                onSave={() => void saveEdit()}
                onCancel={cancelEdit}
              />
            </View>
          ))}

          {editingField ? (
            <Text style={styles.helper}>Only one field is edited at a time</Text>
          ) : null}
        </View>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerPressable: {
    width: '100%',
    gap: 6,
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
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: colors.sand,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  editBadgeLabel: {
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
  body: {
    marginTop: 14,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  prefRow: {
    paddingVertical: 14,
    gap: 8,
  },
  prefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  fieldLabel: {
    flex: 1,
    fontFamily: fontFamily.manrope.regular,
    fontSize: 9,
    letterSpacing: 0.7,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  editLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 13,
    color: colors.forest,
  },
  editingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  editingDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.muted,
  },
  editingLabel: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 10,
    fontStyle: 'italic',
    color: colors.muted,
  },
  fieldValue: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.forest,
  },
  fieldValueEmpty: {
    color: colors.muted,
    fontFamily: fontFamily.manrope.regular,
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: colors.forest,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fontFamily.manrope.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.forest,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: colors.forest,
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  saveBtnDisabled: {
    opacity: 0.85,
  },
  savePressable: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  savePressed: {
    opacity: 0.88,
  },
  saveLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 13,
    color: colors.sand,
    includeFontPadding: false,
  },
  cancelHit: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 13,
    color: colors.muted,
  },
  helper: {
    alignSelf: 'flex-end',
    fontFamily: fontFamily.manrope.regular,
    fontSize: 10,
    fontStyle: 'italic',
    color: colors.muted,
    marginTop: 2,
    marginBottom: 2,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  pressed: {
    opacity: 0.75,
  },
});
