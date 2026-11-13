/**
 * Full-height / medium bottom sheet shell (Modal + slide).
 */
import type { ReactNode } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type SheetModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  leftAction?: { label: string; onPress: () => void };
  rightAction?: { label: string; onPress: () => void };
  /** fraction of screen height for sheet body (default 0.92) */
  heightRatio?: number;
  /**
   * Lock sheet to heightRatio so scrollable children (calendars, lists)
   * get a real flex height instead of clipping under maxHeight.
   */
  fillHeight?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function SheetModal({
  visible,
  onClose,
  title,
  leftAction,
  rightAction,
  heightRatio = 0.92,
  fillHeight = false,
  children,
  footer,
  contentStyle,
}: SheetModalProps) {
  const insets = useSafeAreaInsets();
  const heightPct = `${Math.round(heightRatio * 100)}%`;
  const filledHeight = Math.round(Dimensions.get('window').height * heightRatio);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} accessibilityLabel="Dismiss" />
        <View
          style={[
            styles.sheet,
            fillHeight
              ? { height: filledHeight, maxHeight: filledHeight }
              : { maxHeight: heightPct },
            {
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <View style={styles.handle} />
          {(title || leftAction || rightAction) && (
            <View style={styles.header}>
              <View style={styles.headerSide}>
                {leftAction ? (
                  <Pressable onPress={leftAction.onPress} hitSlop={8}>
                    <Text style={styles.headerAction}>{leftAction.label}</Text>
                  </Pressable>
                ) : null}
              </View>
              {title ? (
                <Text style={styles.title}>{title}</Text>
              ) : (
                <View style={styles.titleSpacer} />
              )}
              <View style={[styles.headerSide, styles.headerSideRight]}>
                {rightAction ? (
                  <Pressable onPress={rightAction.onPress} hitSlop={8}>
                    <Text style={styles.headerAction}>{rightAction.label}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          )}
          <View style={[styles.body, fillHeight && styles.bodyFill, contentStyle]}>{children}</View>
          {footer}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(27, 41, 21, 0.35)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '48%',
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 44,
  },
  headerSide: {
    width: 72,
  },
  headerSideRight: {
    alignItems: 'flex-end',
  },
  headerAction: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 15,
    color: colors.accent,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fontFamily.cormorant.regular,
    fontSize: 22,
    color: colors.forest,
  },
  titleSpacer: {
    flex: 1,
  },
  body: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  bodyFill: {
    flex: 1,
    minHeight: 0,
  },
});
