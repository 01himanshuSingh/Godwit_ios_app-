import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { UpcomingTripsList } from '@/features/trips/components/UpcomingTripsList';
import type { ClientSaleTrip } from '@/lib/firebase/sales/getClientUpcomingSales';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { TEST_CLIENT_LOOKUP_ADMIN_ID, TEST_CLIENT_LOOKUP_ID } from '@/mocks/testingClientSession';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

const TAB_BAR_CLEARANCE = 96;

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
  const { profile, isHydrating } = useActiveClientProfile();
  const pagePad = width < 360 ? 16 : width >= 768 ? 32 : 24;
  const titleSize = width < 360 ? 34 : width >= 768 ? 44 : 40;

  const { adminId, clientId } = useMemo(
    () => ({
      adminId: profile?.adminId?.trim() || TEST_CLIENT_LOOKUP_ADMIN_ID,
      clientId: profile?.clientId?.trim() || TEST_CLIENT_LOOKUP_ID,
    }),
    [profile],
  );

  const handleTripPress = useCallback(
    (trip: ClientSaleTrip) => {
      router.push({
        pathname: '/trips/[saleId]',
        params: {
          saleId: trip.saleId,
          adminId: trip.adminId || adminId,
          clientId: trip.clientId || clientId,
        },
      });
    },
    [router, adminId, clientId],
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingHorizontal: pagePad }]}>
        <Text
          style={[styles.title, { fontSize: titleSize, lineHeight: titleSize + 6 }]}
          accessibilityRole="header"
        >
          Trips
        </Text>
        <Text style={styles.subtitle}>Everything arranged, In order.</Text>
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
        {segment === 'current' ? (
          <Text style={styles.empty}>
            Current trips (in-progress / travel-date today) will appear here.
          </Text>
        ) : null}

        {segment === 'upcoming' && !isHydrating ? (
          <UpcomingTripsList adminId={adminId} clientId={clientId} onTripPress={handleTripPress} />
        ) : null}

        {segment === 'upcoming' && isHydrating ? (
          <Text style={styles.empty}>Loading client session…</Text>
        ) : null}

        {segment === 'past' ? <Text style={styles.empty}>Past trips will appear here.</Text> : null}
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
    paddingTop: 8,
    paddingBottom: 18,
    gap: 6,
  },
  title: {
    fontFamily: fontFamily.cormorant.regular,
    color: colors.forest,
  },
  subtitle: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    lineHeight: 20,
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
    fontSize: 15,
    color: colors.muted,
  },
  segmentLabelActive: {
    color: colors.forest,
  },
  segmentUnderline: {
    marginTop: 10,
    height: 2,
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
    paddingBottom: TAB_BAR_CLEARANCE,
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
