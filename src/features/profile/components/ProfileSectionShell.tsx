/**
 * Shared chrome for every Profile hub sub-screen (back + title + scroll body).
 */
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type ProfileSectionShellProps = {
  title: string;
  subtitle?: string | null;
  /**
   * Optional control aligned with the subtitle row (e.g. Payments → Account statement).
   */
  subtitleTrailing?: ReactNode;
  /** Back row label — default "Profile". Detail screens pass "Travellers". */
  backLabel?: string;
  /** Override default `router.back()` (e.g. in-tab Requests overlay). */
  onBack?: () => void;
  /** Extra bottom padding inside scroll (e.g. clear floating tab bar). */
  contentBottomInset?: number;
  /** Keep taps working while keyboard is open (forms). */
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  children?: ReactNode;
};

function layoutForWidth(width: number) {
  if (width < 360) {
    return {
      pagePad: 16,
      sectionTop: 20,
      titleSize: 28,
      titleLineHeight: 34,
      subtitleSize: 12,
      subtitleLineHeight: 16,
      backSize: 15,
      chevronSize: 20,
      backGap: 4,
      headerToTitle: 18,
      titleToSubtitle: 6,
      bodyTop: 16,
    };
  }
  if (width < 768) {
    return {
      pagePad: 24,
      sectionTop: 24,
      titleSize: 34,
      titleLineHeight: 40,
      subtitleSize: 14,
      subtitleLineHeight: 20,
      backSize: 16,
      chevronSize: 22,
      backGap: 4,
      headerToTitle: 20,
      titleToSubtitle: 8,
      bodyTop: 18,
    };
  }
  return {
    pagePad: 40,
    sectionTop: 28,
    titleSize: 36,
    titleLineHeight: 42,
    subtitleSize: 15,
    subtitleLineHeight: 22,
    backSize: 16,
    chevronSize: 22,
    backGap: 6,
    headerToTitle: 22,
    titleToSubtitle: 8,
    bodyTop: 20,
  };
}

export function ProfileSectionShell({
  title,
  subtitle,
  subtitleTrailing,
  backLabel = 'Profile',
  onBack,
  contentBottomInset = 0,
  keyboardShouldPersistTaps,
  children,
}: ProfileSectionShellProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);
  const showSubtitleRow = Boolean(subtitle) || Boolean(subtitleTrailing);

  return (
    <View style={styles.root}>
      {/* Safe area + GODWIT header come from app/_layout AppChromeHeader */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: layout.pagePad,
            paddingTop: layout.sectionTop,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Back to ${backLabel}`}
          onPress={() => {
            if (onBack) {
              onBack();
              return;
            }
            router.back();
          }}
          hitSlop={12}
          style={styles.backPressable}
        >
          <View style={[styles.backInner, { gap: layout.backGap }]}>
            <Feather name="chevron-left" size={layout.chevronSize} color={colors.muted} />
            <Text
              style={[styles.backLabel, { fontSize: layout.backSize }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {backLabel}
            </Text>
          </View>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: layout.pagePad,
            paddingTop: layout.headerToTitle,
            paddingBottom: Math.max(insets.bottom, 16) + 24 + contentBottomInset,
            maxWidth: Math.min(width, width >= 768 ? 680 : width),
            alignSelf: 'center',
            width: '100%',
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode="on-drag"
      >
        <Text
          style={[styles.title, { fontSize: layout.titleSize, lineHeight: layout.titleLineHeight }]}
          accessibilityRole="header"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        {showSubtitleRow ? (
          <View
            style={[
              styles.subtitleRow,
              {
                marginTop: layout.titleToSubtitle,
                gap: width < 360 ? 10 : 16,
              },
            ]}
          >
            {subtitle ? (
              <Text
                style={[
                  styles.subtitle,
                  {
                    fontSize: layout.subtitleSize,
                    lineHeight: layout.subtitleLineHeight,
                  },
                ]}
                selectable
              >
                {subtitle}
              </Text>
            ) : (
              <View style={styles.subtitleSpacer} />
            )}
            {subtitleTrailing ? (
              <View style={styles.subtitleTrailing}>{subtitleTrailing}</View>
            ) : null}
          </View>
        ) : null}
        <View style={[styles.body, { marginTop: layout.bodyTop }]}>{children}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingBottom: 0,
  },
  backPressable: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  backInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    paddingVertical: 4,
  },
  backLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
    flexShrink: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 0,
  },
  title: {
    fontFamily: fontFamily.cormorant.regular,
    color: colors.forest,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  subtitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
  },
  subtitleSpacer: {
    flex: 1,
    minWidth: 0,
  },
  subtitleTrailing: {
    flexShrink: 0,
    maxWidth: '42%',
    alignItems: 'flex-end',
  },
  body: {
    gap: 12,
  },
});
