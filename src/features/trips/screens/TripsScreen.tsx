import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { RequestsScreen } from '@/features/requests';
import { TripsScreenSkeleton } from '@/features/trips/components/TripsScreenSkeleton';
import { UpcomingTripsList } from '@/features/trips/components/UpcomingTripsList';
import type { ClientSaleTrip } from '@/lib/firebase/sales/getClientUpcomingSales';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type TripsSegment = 'current' | 'upcoming' | 'past';

const SEGMENTS: { key: TripsSegment; label: string }[] = [
  { key: 'current', label: 'Current' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
];

export function TripsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [segment, setSegment] = useState<TripsSegment>('upcoming');
  const [showRequests, setShowRequests] = useState(false);
  const { profile, isHydrating } = useActiveClientProfile();
  const pagePad = width < 360 ? 16 : width >= 768 ? 32 : 24;
  const headerTop = width < 360 ? 16 : width >= 768 ? 28 : 22;

  const { adminId, clientId, hasScope } = useMemo(() => {
    const nextAdminId = profile?.adminId?.trim() ?? '';
    const nextClientId = profile?.clientId?.trim() ?? '';
    return {
      adminId: nextAdminId,
      clientId: nextClientId,
      hasScope: Boolean(nextAdminId && nextClientId),
    };
  }, [profile]);

  const handleTripPress = useCallback(
    (trip: ClientSaleTrip) => {
      const saleId = trip.saleId?.trim();
      const tripAdminId = trip.adminId?.trim() || adminId;
      const tripClientId = trip.clientId?.trim() || clientId;
      if (!saleId || !tripAdminId || !tripClientId) {
        return;
      }
      router.push({
        pathname: '/trips/[saleId]',
        params: {
          saleId,
          adminId: tripAdminId,
          clientId: tripClientId,
        },
      });
    },
    [router, adminId, clientId],
  );

  const handleNewRequest = useCallback(() => {
    setShowRequests(true);
  }, []);

  const handleRequestsBack = useCallback(() => {
    setShowRequests(false);
  }, []);

  if (showRequests) {
    return <RequestsScreen onBack={handleRequestsBack} />;
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingHorizontal: pagePad, paddingTop: headerTop }]}>
        <Text style={styles.title} accessibilityRole="header">
          Trips
        </Text>
        <Text style={styles.subtitle}>Everything arranged, in order.</Text>
      </View>

      <View style={[styles.segmentRow, { paddingHorizontal: pagePad }]}>
        {SEGMENTS.map((item) => {
          const active = item.key === segment;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setSegment(item.key)}
              style={styles.segmentHit}
            >
              <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                {item.label}
              </Text>
              <View style={[styles.segmentUnderline, active && styles.segmentUnderlineActive]} />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.segmentBaseLine} />

      <View style={styles.body}>
        {isHydrating ? <TripsScreenSkeleton /> : null}

        {!isHydrating && !hasScope ? (
          <Text style={styles.empty}>
            Account details are missing. Please sign in again to see your trips.
          </Text>
        ) : null}

        {!isHydrating && hasScope && segment === 'current' ? (
          <UpcomingTripsList
            adminId={adminId}
            clientId={clientId}
            mode="current"
            onTripPress={handleTripPress}
            onNewRequest={handleNewRequest}
          />
        ) : null}

        {!isHydrating && hasScope && segment === 'upcoming' ? (
          <UpcomingTripsList
            adminId={adminId}
            clientId={clientId}
            mode="upcoming"
            onTripPress={handleTripPress}
            onNewRequest={handleNewRequest}
          />
        ) : null}

        {!isHydrating && hasScope && segment === 'past' ? (
          <UpcomingTripsList
            adminId={adminId}
            clientId={clientId}
            mode="past"
            onTripPress={handleTripPress}
            onNewRequest={handleNewRequest}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingBottom: 18,
    gap: 6,
  },
  title: {
    fontFamily: fontFamily.cormorant.regular,
    fontSize: 28,
    lineHeight: 34,
    color: colors.forest,
  },
  subtitle: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 28,
  },
  segmentHit: {
    paddingBottom: 10,
  },
  segmentLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  segmentLabelActive: {
    fontFamily: fontFamily.manrope.semibold,
    color: colors.forest,
  },
  segmentUnderline: {
    marginTop: 10,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  segmentUnderlineActive: {
    backgroundColor: colors.forest,
  },
  segmentBaseLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  empty: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 48,
    paddingHorizontal: 24,
  },
});
