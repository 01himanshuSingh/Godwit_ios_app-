/**
 * Payments → Account / statement — compact coming-soon bottom sheet.
 * Matches Godwit fiduciary drawer: handle, close, audit note, Close CTA.
 */
import Feather from '@expo/vector-icons/Feather';
import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type AccountStatementSheetProps = {
  visible: boolean;
  onClose: () => void;
};

function layoutForWidth(width: number) {
  const narrow = width < 360;
  const compact = width < 390;
  return {
    pad: narrow ? 16 : compact ? 20 : 22,
    gap: narrow ? 12 : 14,
    titleSize: narrow ? 24 : compact ? 26 : 28,
    titleLine: narrow ? 30 : compact ? 32 : 34,
    bodySize: narrow ? 13 : 14,
    bodyLine: narrow ? 19 : 21,
    noteSize: narrow ? 12 : 13,
    noteLine: narrow ? 17 : 19,
    notePad: narrow ? 12 : 14,
    shieldSize: narrow ? 14 : 16,
    closeSize: narrow ? 14 : 15,
    closeMinH: narrow ? 48 : 52,
    closeIcon: narrow ? 16 : 18,
  };
}

export function AccountStatementSheet({ visible, onClose }: AccountStatementSheetProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop} accessibilityViewIsModal>
        <Pressable
          style={styles.dismissArea}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss account statement"
        />

        <View
          style={[
            styles.sheet,
            {
              paddingHorizontal: layout.pad,
              paddingBottom: Math.max(insets.bottom, 16),
              gap: layout.gap,
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.topRow}>
            <View style={styles.topSpacer} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={12}
              onPress={onClose}
              style={styles.closeBtn}
            >
              <Feather name="x" size={layout.closeIcon} color={colors.muted} />
            </Pressable>
          </View>

          <Text
            style={[styles.title, { fontSize: layout.titleSize, lineHeight: layout.titleLine }]}
            accessibilityRole="header"
          >
            Account statement
          </Text>
          <Text style={[styles.body, { fontSize: layout.bodySize, lineHeight: layout.bodyLine }]}>
            Your Godwit account statement will be available here soon.
          </Text>

          <View
            style={[
              styles.noteBox,
              { paddingHorizontal: layout.notePad, paddingVertical: layout.notePad },
            ]}
          >
            <View style={styles.noteIcon}>
              <Feather name="shield" size={layout.shieldSize} color={colors.forest} />
            </View>
            <Text
              style={[styles.noteCopy, { fontSize: layout.noteSize, lineHeight: layout.noteLine }]}
            >
              Statements are audited by Godwit Fiduciary Services (Geneva) and released at the end
              of each billing cycle.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeCta,
              { minHeight: layout.closeMinH },
              pressed && styles.closeCtaPressed,
            ]}
          >
            <Text style={[styles.closeCtaLabel, { fontSize: layout.closeSize }]}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(27, 41, 21, 0.42)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
  },
  topSpacer: {
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -4,
  },
  title: {
    marginTop: -4,
    fontFamily: fontFamily.cormorant.medium,
    color: colors.forest,
  },
  body: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
    marginTop: -4,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  noteIcon: {
    marginTop: 1,
  },
  noteCopy: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
  },
  closeCta: {
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.forest,
  },
  closeCtaPressed: {
    opacity: 0.88,
  },
  closeCtaLabel: {
    fontFamily: fontFamily.manrope.semibold,
    color: colors.primaryForeground,
  },
});
