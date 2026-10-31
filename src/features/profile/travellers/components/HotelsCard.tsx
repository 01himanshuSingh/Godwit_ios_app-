/**
 * Expandable Hotels prefs card — brands + room type with inline Edit.
 * Edit mode: bordered input + corner marks + Save / Cancel (mock).
 */
import Feather from '@expo/vector-icons/Feather';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  useWindowDimensions,
  View,
} from 'react-native';

import type { TravellerHotelPrefField, TravellerHotelPrefs } from '@/lib/firebase/customers';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type HotelsCardProps = {
  hotelPrefs: TravellerHotelPrefs;
  initiallyExpanded?: boolean;
  savingField?: TravellerHotelPrefField | null;
  onSaveField?: (field: TravellerHotelPrefField, value: string) => void | Promise<void>;
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
      editSize: 13,
      chevronSize: 18,
      fieldGap: 8,
      inputPadH: 14,
      inputPadV: 12,
      inputRadius: 10,
      savePadH: 20,
      savePadV: 8,
      saveSize: 14,
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
    editSize: 14,
    chevronSize: 20,
    fieldGap: 8,
    inputPadH: 16,
    inputPadV: 14,
    inputRadius: 12,
    savePadH: 22,
    savePadV: 9,
    saveSize: 15,
  };
}

function PrefRow({
  field,
  label,
  value,
  layout,
  editing,
  draft,
  saving,
  onChangeDraft,
  onStartEdit,
  onSave,
  onCancel,
}: {
  field: TravellerHotelPrefField;
  label: string;
  value: string | null;
  layout: ReturnType<typeof layoutForWidth>;
  editing: boolean;
  draft: string;
  saving: boolean;
  onChangeDraft: (text: string) => void;
  onStartEdit: (field: TravellerHotelPrefField) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (editing) {
    return (
      <View style={[styles.prefRow, { gap: layout.fieldGap }]}>
        <Text style={[styles.fieldLabel, { fontSize: layout.fieldLabelSize, letterSpacing: 0.7 }]}>
          {label}
        </Text>
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
          style={[
            styles.input,
            {
              borderRadius: layout.inputRadius,
              paddingHorizontal: layout.inputPadH,
              paddingVertical: layout.inputPadV,
              fontSize: layout.fieldValueSize,
              lineHeight: layout.fieldValueLineHeight,
            },
          ]}
          accessibilityLabel={label}
        />
        <View style={styles.actions}>
          <View
            style={[
              styles.saveBtn,
              {
                paddingHorizontal: layout.savePadH,
                paddingVertical: layout.savePadV,
                opacity: saving ? 0.85 : 1,
              },
            ]}
          >
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
                <Text style={[styles.saveLabel, { fontSize: layout.saveSize }]}>Save</Text>
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
            <Text style={[styles.cancelLabel, { fontSize: layout.editSize }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.prefRow, { gap: layout.fieldGap }]}>
      <View style={styles.prefHeader}>
        <Text style={[styles.fieldLabel, { fontSize: layout.fieldLabelSize, letterSpacing: 0.7 }]}>
          {label}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${label}`}
          onPress={() => onStartEdit(field)}
          hitSlop={8}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={[styles.editLabel, { fontSize: layout.editSize }]}>Edit</Text>
        </Pressable>
      </View>
      <Text
        style={[
          styles.fieldValue,
          {
            fontSize: layout.fieldValueSize,
            lineHeight: layout.fieldValueLineHeight,
            color: value ? colors.forest : colors.muted,
          },
        ]}
        selectable={Boolean(value)}
      >
        {value || 'Not set'}
      </Text>
    </View>
  );
}

export function HotelsCard({
  hotelPrefs,
  initiallyExpanded = true,
  savingField = null,
  onSaveField,
}: HotelsCardProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [editingField, setEditingField] = useState<TravellerHotelPrefField | null>(null);
  const [draft, setDraft] = useState('');

  const summary =
    hotelPrefs.summaryLine ||
    hotelPrefs.preferredHotelBrands ||
    hotelPrefs.preferredRoomType ||
    hotelPrefs.specialRequests ||
    'Hotel preferences';

  const toggle = () => {
    if (editingField) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const startEdit = (field: TravellerHotelPrefField) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditingField(field);
    setDraft(
      field === 'preferredHotelBrands'
        ? (hotelPrefs.preferredHotelBrands ?? '')
        : (hotelPrefs.preferredRoomType ?? ''),
    );
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
        accessibilityLabel="Hotels"
        onPress={toggle}
        hitSlop={8}
        style={styles.headerPressable}
      >
        <View style={styles.header}>
          <Text
            style={[styles.sectionLabel, { fontSize: layout.sectionLabelSize, letterSpacing: 0.8 }]}
          >
            HOTELS
          </Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryTextWrap}>
              <Text
                style={[
                  styles.summary,
                  {
                    fontSize: layout.summarySize,
                    lineHeight: layout.summaryLineHeight,
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {summary}
              </Text>
            </View>
            <View style={styles.chevronWrap} pointerEvents="none">
              <Feather
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={layout.chevronSize}
                color="#C4C0B8"
              />
            </View>
          </View>
        </View>
      </Pressable>

      {expanded ? (
        <>
          <View style={styles.divider} />
          <View style={styles.fields}>
            <PrefRow
              field="preferredHotelBrands"
              label="PREFERRED HOTEL BRANDS"
              value={hotelPrefs.preferredHotelBrands}
              layout={layout}
              editing={editingField === 'preferredHotelBrands'}
              draft={draft}
              saving={savingField === 'preferredHotelBrands'}
              onChangeDraft={setDraft}
              onStartEdit={startEdit}
              onSave={() => void saveEdit()}
              onCancel={cancelEdit}
            />
            <View style={styles.rowDivider} />
            <PrefRow
              field="preferredRoomType"
              label="PREFERRED ROOM TYPE"
              value={hotelPrefs.preferredRoomType}
              layout={layout}
              editing={editingField === 'preferredRoomType'}
              draft={draft}
              saving={savingField === 'preferredRoomType'}
              onChangeDraft={setDraft}
              onStartEdit={startEdit}
              onSave={() => void saveEdit()}
              onCancel={cancelEdit}
            />
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
  headerPressable: {
    width: '100%',
  },
  header: {
    width: '100%',
    gap: 8,
  },
  sectionLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  summaryTextWrap: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  summary: {
    width: '100%',
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
  },
  chevronWrap: {
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: 16,
    marginBottom: 4,
  },
  fields: {
    width: '100%',
  },
  prefRow: {
    paddingVertical: 14,
  },
  prefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  fieldLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
    textTransform: 'uppercase',
    flex: 1,
  },
  editLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
  },
  fieldValue: {
    fontFamily: fontFamily.manrope.regular,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    fontFamily: fontFamily.manrope.regular,
    color: colors.forest,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
  },
  saveBtn: {
    backgroundColor: colors.forest,
    borderRadius: 999,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  savePressable: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 78,
  },
  savePressed: {
    opacity: 0.88,
  },
  saveLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.sand,
    includeFontPadding: false,
  },
  cancelHit: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  pressed: {
    opacity: 0.75,
  },
});
