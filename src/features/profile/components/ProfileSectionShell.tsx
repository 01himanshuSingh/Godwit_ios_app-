/**
 * Shared chrome for every Profile hub sub-screen (back + title + scroll body).
 *
 * Payments hub: pass `stickyHeader` + `collapsibleBody` so title/hero scroll away,
 * tabs pin under the Profile back row, and only the tab body keeps scrolling.
 */
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type ProfileSectionShellLayoutPreset =
  'default' | 'requests' | 'requestForm' | 'travellers' | 'payments' | 'invoiceDetail';

type ProfileSectionShellProps = {
  /** Omit / empty to hide the page heading (e.g. traveller detail uses a hero card). */
  title?: string | null;
  subtitle?: string | null;
  /**
   * Optional control aligned with the title row (e.g. Payments → Account / statement).
   */
  titleTrailing?: ReactNode;
  /**
   * Optional control aligned with the subtitle row.
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
  /**
   * `requests` — New request service picker.
   * `requestForm` — active service form (Hotel, Flight, …).
   * `travellers` — Travellers list type scale.
   * `payments` — Payments hub type scale.
   * `invoiceDetail` — single invoice screen (19 serif title · 10 subtitle).
   * Other profile/hub screens keep `default`.
   */
  layoutPreset?: ProfileSectionShellLayoutPreset;
  /**
   * Content between subtitle and sticky header (e.g. Amount due card).
   * Scrolls away with the page title.
   */
  collapsibleBody?: ReactNode;
  /**
   * Pins under the fixed Profile back once it reaches the top
   * (e.g. Payments tabs). Requires a solid background on the node.
   */
  stickyHeader?: ReactNode;
  /** Forwarded to the root ScrollView (tab-bar hide, etc.). */
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
  children?: ReactNode;
};

type ShellLayout = {
  pagePad: number;
  sectionTop: number;
  titleSize: number;
  titleLineHeight: number;
  subtitleSize: number;
  subtitleLineHeight: number;
  backSize: number;
  chevronSize: number;
  backGap: number;
  headerToTitle: number;
  titleToSubtitle: number;
  bodyTop: number;
};

function layoutForWidth(
  width: number,
  preset: ProfileSectionShellLayoutPreset = 'default',
): ShellLayout {
  if (preset === 'requestForm') {
    // Active New request form screens — compact premium spacing.
    if (width < 360) {
      return {
        pagePad: 16,
        sectionTop: 20,
        titleSize: 28,
        titleLineHeight: 34,
        subtitleSize: 13,
        subtitleLineHeight: 18,
        backSize: 15,
        chevronSize: 20,
        backGap: 4,
        headerToTitle: 16,
        titleToSubtitle: 16,
        bodyTop: 20,
      };
    }
    if (width < 768) {
      return {
        pagePad: 20,
        sectionTop: 24,
        titleSize: 32,
        titleLineHeight: 38,
        subtitleSize: 14,
        subtitleLineHeight: 20,
        backSize: 16,
        chevronSize: 22,
        backGap: 4,
        headerToTitle: 18,
        titleToSubtitle: 20,
        bodyTop: 24,
      };
    }
    return {
      pagePad: 32,
      sectionTop: 28,
      titleSize: 34,
      titleLineHeight: 40,
      subtitleSize: 15,
      subtitleLineHeight: 22,
      backSize: 16,
      chevronSize: 22,
      backGap: 6,
      headerToTitle: 20,
      titleToSubtitle: 24,
      bodyTop: 28,
    };
  }

  if (preset === 'travellers') {
    // Travellers list — fixed type scale from design spec.
    const pagePad = width < 360 ? 16 : width >= 768 ? 40 : 24;
    return {
      pagePad,
      sectionTop: width < 360 ? 20 : 24,
      titleSize: 27,
      titleLineHeight: 32,
      subtitleSize: 12,
      subtitleLineHeight: 16,
      backSize: 11,
      chevronSize: 14,
      backGap: 4,
      headerToTitle: 18,
      titleToSubtitle: 8,
      bodyTop: 18,
    };
  }

  if (preset === 'payments') {
    // Payments hub — type scale from design spec; slight pad tighten on small phones.
    const narrow = width < 360;
    const pagePad = narrow ? 16 : width >= 768 ? 40 : 24;
    return {
      pagePad,
      sectionTop: narrow ? 20 : 24,
      titleSize: narrow ? 25 : 27,
      titleLineHeight: narrow ? 30 : 32,
      subtitleSize: narrow ? 11 : 12,
      subtitleLineHeight: narrow ? 15 : 16,
      backSize: 11,
      chevronSize: 12,
      backGap: 4,
      headerToTitle: 18,
      titleToSubtitle: 8,
      bodyTop: 18,
    };
  }

  if (preset === 'invoiceDetail') {
    // Invoice detail — INV title 19 serif · trip subtitle 10 · back 11 / chevron 12.
    const narrow = width < 360;
    const pagePad = narrow ? 16 : width >= 768 ? 40 : 24;
    return {
      pagePad,
      sectionTop: narrow ? 20 : 24,
      titleSize: narrow ? 18 : 19,
      titleLineHeight: narrow ? 22 : 24,
      subtitleSize: 10,
      subtitleLineHeight: 14,
      backSize: 11,
      chevronSize: 12,
      backGap: 4,
      headerToTitle: 18,
      titleToSubtitle: 6,
      bodyTop: 18,
    };
  }

  if (preset === 'requests') {
    // Production New request picker — fixed type scale; pad matches RequestServicesGrid.
    if (width < 360) {
      return {
        pagePad: 16,
        sectionTop: 20,
        titleSize: 32,
        titleLineHeight: 38,
        subtitleSize: 13,
        subtitleLineHeight: 18,
        backSize: 16,
        chevronSize: 20,
        backGap: 4,
        headerToTitle: 18,
        titleToSubtitle: 8,
        bodyTop: 16,
      };
    }
    if (width < 768) {
      return {
        pagePad: 20,
        sectionTop: 24,
        titleSize: 32,
        titleLineHeight: 38,
        subtitleSize: 13,
        subtitleLineHeight: 18,
        backSize: 16,
        chevronSize: 22,
        backGap: 4,
        headerToTitle: 20,
        titleToSubtitle: 8,
        bodyTop: 18,
      };
    }
    return {
      pagePad: 32,
      sectionTop: 28,
      titleSize: 32,
      titleLineHeight: 38,
      subtitleSize: 13,
      subtitleLineHeight: 18,
      backSize: 16,
      chevronSize: 22,
      backGap: 6,
      headerToTitle: 22,
      titleToSubtitle: 8,
      bodyTop: 20,
    };
  }

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
  titleTrailing,
  subtitleTrailing,
  backLabel = 'Profile',
  onBack,
  contentBottomInset = 0,
  keyboardShouldPersistTaps,
  layoutPreset = 'default',
  collapsibleBody,
  stickyHeader,
  onScroll,
  scrollEventThrottle,
  children,
}: ProfileSectionShellProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width, layoutPreset), [width, layoutPreset]);
  const heading = title?.trim() || '';
  const showTitle = Boolean(heading);
  const showSubtitleRow = Boolean(subtitle) || Boolean(subtitleTrailing);
  const useSticky = Boolean(stickyHeader);
  const contentMaxWidth = Math.min(width, width >= 768 ? 680 : width);
  const bottomPad = Math.max(insets.bottom, 16) + 24 + contentBottomInset;

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    router.back();
  };

  const backControl = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Back to ${backLabel}`}
      onPress={handleBack}
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
  );

  const titleBlock = (
    <>
      {showTitle ? (
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              { fontSize: layout.titleSize, lineHeight: layout.titleLineHeight },
              titleTrailing ? styles.titleFlex : null,
            ]}
            accessibilityRole="header"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {heading}
          </Text>
          {titleTrailing ? <View style={styles.titleTrailing}>{titleTrailing}</View> : null}
        </View>
      ) : null}
      {showTitle && showSubtitleRow ? (
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
    </>
  );

  return (
    <View style={styles.root}>
      {/*
        Sticky mode (Payments): one scroll from the Profile chevron.
        Title + amount-due collapse; tabs pin at the top; tab lists keep scrolling.
        Default hubs keep a fixed back above the scroll.
      */}
      {!useSticky ? (
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: layout.pagePad,
              paddingTop: layout.sectionTop,
            },
          ]}
        >
          {backControl}
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          useSticky
            ? {
                paddingBottom: bottomPad,
                maxWidth: contentMaxWidth,
                alignSelf: 'center',
                width: '100%',
              }
            : {
                paddingHorizontal: layout.pagePad,
                paddingTop: layout.headerToTitle,
                paddingBottom: bottomPad,
                maxWidth: contentMaxWidth,
                alignSelf: 'center',
                width: '100%',
              },
        ]}
        stickyHeaderIndices={useSticky ? [1] : undefined}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode="on-drag"
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle ?? (onScroll ? 16 : undefined)}
      >
        {useSticky ? (
          <>
            {/* [0] Scrolls away: chevron → title → description → amount due */}
            <View
              style={[
                styles.collapseBlock,
                {
                  paddingHorizontal: layout.pagePad,
                  paddingTop: layout.sectionTop,
                },
              ]}
            >
              {backControl}
              <View style={{ marginTop: layout.headerToTitle }}>{titleBlock}</View>
              {collapsibleBody ? (
                <View style={[styles.collapseBody, { marginTop: showTitle ? layout.bodyTop : 0 }]}>
                  {collapsibleBody}
                </View>
              ) : null}
            </View>

            {/* [1] Stops here — Upcoming / Invoices / Received / Credits pin */}
            <View
              style={[
                styles.stickyBlock,
                {
                  paddingHorizontal: layout.pagePad,
                  paddingTop: 12,
                },
              ]}
            >
              {stickyHeader}
            </View>

            {/* [2] Below tabs — only this section keeps scrolling */}
            <View style={[styles.body, { paddingHorizontal: layout.pagePad, marginTop: 14 }]}>
              {children}
            </View>
          </>
        ) : (
          <>
            {titleBlock}
            {collapsibleBody ? (
              <View style={[styles.collapseBody, { marginTop: showTitle ? layout.bodyTop : 0 }]}>
                {collapsibleBody}
              </View>
            ) : null}
            <View
              style={[
                styles.body,
                {
                  marginTop: showTitle || collapsibleBody ? layout.bodyTop : 0,
                },
              ]}
            >
              {children}
            </View>
          </>
        )}
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
    backgroundColor: colors.background,
  },
  scrollContent: {
    gap: 0,
  },
  collapseBlock: {
    width: '100%',
  },
  collapseBody: {
    width: '100%',
  },
  stickyBlock: {
    width: '100%',
    backgroundColor: colors.background,
    paddingBottom: 4,
    // Opaque page bg only — no elevation/shadow so pinned tabs match the screen.
    zIndex: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
  },
  title: {
    fontFamily: fontFamily.cormorant.regular,
    color: colors.forest,
  },
  titleFlex: {
    flex: 1,
    minWidth: 0,
  },
  titleTrailing: {
    flexShrink: 0,
    alignItems: 'flex-end',
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
