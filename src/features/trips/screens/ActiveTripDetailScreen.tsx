/**
 * Active Trip detail shell — one fetch, then service-specific body.
 *
 *   hotel       → features/trips/hotel/HotelActiveTripBody
 *   air         → features/trips/air/AirActiveTripBody
 *   vip         → features/trips/vip/VipActiveTripBody
 *   chauffeur   → features/trips/chauffeur/ChauffeurActiveTripBody
 *   privateJet  → features/trips/private-jet/PrivateJetActiveTripBody
 *   yacht       → features/trips/yacht/YachtActiveTripBody
 *   other       → GenericActiveTripBody
 */
import Feather from '@expo/vector-icons/Feather';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeTabBar, HOME_TAB_BAR_CONTENT_HEIGHT } from '@/features/home/components/HomeTabBar';
import { isMainTabKey, requestMainTab } from '@/features/home/tabBar/mainTabSelection';
import { AirActiveTripBody } from '@/features/trips/air/AirActiveTripBody';
import { ChauffeurActiveTripBody } from '@/features/trips/chauffeur/ChauffeurActiveTripBody';
import { GenericActiveTripBody } from '@/features/trips/components/GenericActiveTripBody';
import {
  TripsExceptionCard,
  type TripsExceptionVariant,
} from '@/features/trips/components/TripsExceptionCard';
import { TripDocumentsCard } from '@/features/trips/components/TripDocumentsCard';
import { HotelActiveTripBody } from '@/features/trips/hotel/HotelActiveTripBody';
import { PrivateJetActiveTripBody } from '@/features/trips/private-jet/PrivateJetActiveTripBody';
import { VipActiveTripBody } from '@/features/trips/vip/VipActiveTripBody';
import { YachtActiveTripBody } from '@/features/trips/yacht/YachtActiveTripBody';
import { getClientSaleActiveTripDetailSafe } from '@/lib/firebase/sales/getActiveTripDetail';
import { mapTripsLoadErrorToMessage } from '@/lib/firebase/sales/mapTripsLoadError';
import { isScreenBooting, ScreenBootLoader } from '@/ui/loading';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type ActiveTripDetailScreenProps = {
  adminId: string;
  clientId: string;
  saleId: string;
};

export function ActiveTripDetailScreen({ adminId, clientId, saleId }: ActiveTripDetailScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const layout = useMemo(() => {
    const isCompact = width < 360;
    const isWide = width >= 768;
    const pagePad = isCompact ? 16 : isWide ? 40 : 24;
    const contentMaxWidth = Math.min(width, isWide ? 680 : width);
    const tabBarPad = HOME_TAB_BAR_CONTENT_HEIGHT + Math.max(insets.bottom, 8);

    return {
      pagePad,
      contentMaxWidth,
      titleSize: isCompact ? 28 : isWide ? 40 : 34,
      titleLineHeight: isCompact ? 34 : isWide ? 46 : 40,
      subtitleSize: isCompact ? 14 : 16,
      detailValueSize: isCompact ? 14 : 16,
      bottomPad: tabBarPad + 20,
    };
  }, [width, insets.bottom]);

  const contentColumnStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      width: '100%',
      maxWidth: layout.contentMaxWidth,
      alignSelf: 'center',
      paddingHorizontal: layout.pagePad,
    }),
    [layout.contentMaxWidth, layout.pagePad],
  );

  const scopedAdminId = adminId.trim();
  const scopedClientId = clientId.trim();
  const scopedSaleId = saleId.trim();
  const hasScope = Boolean(scopedAdminId && scopedClientId);
  const hasSaleId = Boolean(scopedSaleId);
  const canFetch = hasScope && hasSaleId;

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['trips', 'active-detail', scopedAdminId, scopedClientId, scopedSaleId],
    queryFn: () => getClientSaleActiveTripDetailSafe(scopedAdminId, scopedClientId, scopedSaleId),
    enabled: canFetch,
  });

  const detail = data?.detail ?? null;
  const queryErrorMessage = data?.errorMessage
    ? mapTripsLoadErrorToMessage(new Error(data.errorMessage))
    : isError
      ? mapTripsLoadErrorToMessage(error)
      : null;

  const exception = useMemo((): {
    variant: TripsExceptionVariant;
    message?: string | null;
    title?: string;
    canRetry: boolean;
  } | null => {
    if (!hasSaleId) {
      return { variant: 'missing_sale', canRetry: false };
    }
    if (!hasScope) {
      return { variant: 'missing_scope', canRetry: false };
    }
    if (queryErrorMessage) {
      return {
        variant: 'load_error',
        title: 'Couldn’t load booking',
        message: queryErrorMessage,
        canRetry: true,
      };
    }
    if (!isPending && !detail) {
      return { variant: 'not_found', canRetry: true };
    }
    return null;
  }, [hasSaleId, hasScope, queryErrorMessage, isPending, detail]);

  const isHotel = detail?.serviceType === 'hotel' || detail?.serviceType === 'hotelRoomExtension';
  const isAir =
    detail?.serviceType === 'air' ||
    detail?.serviceType === 'airExtras' ||
    detail?.serviceType === 'airReissue';
  const isVip = detail?.serviceType === 'vip';
  const isChauffeur = detail?.serviceType === 'chauffeur';
  const isPrivateJet = detail?.serviceType === 'privateJet';
  const isYacht = detail?.serviceType === 'yacht';

  const bodyLayout = {
    titleSize: layout.titleSize,
    titleLineHeight: layout.titleLineHeight,
    subtitleSize: layout.subtitleSize,
    detailValueSize: layout.detailValueSize,
  };

  const handleTabPress = useCallback(
    (tabKey: string) => {
      if (!isMainTabKey(tabKey)) return;
      requestMainTab(tabKey);
      router.replace('/');
    },
    [router],
  );

  const booting = isScreenBooting({
    enabled: canFetch,
    isPending,
    hasContent: Boolean(detail),
    hasTerminalError: Boolean(exception) && !isPending,
  });

  if (booting) {
    return (
      <View style={styles.root}>
        <ScreenBootLoader accessibilityLabel="Loading your trip" />
        <HomeTabBar activeTab="trips" onTabPress={handleTabPress} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          contentColumnStyle,
          { paddingBottom: layout.bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to itinerary"
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backPressable}
        >
          <View style={styles.backInner}>
            <Feather name="chevron-left" size={20} color={colors.muted} />
            <Text style={styles.backLabel} numberOfLines={1}>
              Itinerary
            </Text>
          </View>
        </Pressable>

        {exception ? (
          <TripsExceptionCard
            embedded
            variant={exception.variant}
            title={exception.title}
            message={exception.message}
            isRetrying={isFetching}
            onRetry={exception.canRetry ? () => void refetch() : undefined}
          />
        ) : null}

        {detail ? (
          <>
            {isHotel ? (
              <HotelActiveTripBody detail={detail} layout={bodyLayout} />
            ) : isAir ? (
              <AirActiveTripBody detail={detail} layout={bodyLayout} />
            ) : isVip ? (
              <VipActiveTripBody detail={detail} layout={bodyLayout} />
            ) : isChauffeur ? (
              <ChauffeurActiveTripBody detail={detail} layout={bodyLayout} />
            ) : isPrivateJet ? (
              <PrivateJetActiveTripBody detail={detail} layout={bodyLayout} />
            ) : isYacht ? (
              <YachtActiveTripBody detail={detail} layout={bodyLayout} />
            ) : (
              <GenericActiveTripBody detail={detail} layout={bodyLayout} />
            )}

            {!isHotel ? (
              <View style={styles.documentsSlot}>
                <TripDocumentsCard voucherUrl={detail.voucherUrl} fileLabel={detail.title} />
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <HomeTabBar activeTab="trips" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backPressable: {
    alignSelf: 'flex-start',
  },
  backInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 40,
    paddingVertical: 8,
  },
  backLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 15,
    color: colors.muted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 14,
  },
  documentsSlot: {
    width: '100%',
  },
});
