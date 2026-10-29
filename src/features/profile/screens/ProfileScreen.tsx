/**
 * Profile tab — client scope same as Trips / Testing.
 * Menu rows navigate to /profile/[section] feature screens.
 */
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { ProfileAccountCard } from '@/features/profile/components/ProfileAccountCard';
import { ProfileMenuCard } from '@/features/profile/components/ProfileMenuCard';
import {
  PROFILE_MENU_ITEMS,
  type ProfileMenuSectionId,
} from '@/features/profile/menu/profileMenuItems';
import { getClientProfileSafe } from '@/lib/firebase/clients';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { TEST_CLIENT_LOOKUP_ADMIN_ID, TEST_CLIENT_LOOKUP_ID } from '@/mocks/testingClientSession';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

const TAB_BAR_CLEARANCE = 96;

export function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { profile: sessionProfile, isHydrating } = useActiveClientProfile();

  const pagePad = width < 360 ? 16 : width >= 768 ? 40 : 24;
  const titleSize = width < 360 ? 34 : width >= 768 ? 48 : 42;
  const contentMax = Math.min(width, width >= 768 ? 680 : width);

  const adminId = sessionProfile?.adminId?.trim() || TEST_CLIENT_LOOKUP_ADMIN_ID;
  const clientId = sessionProfile?.clientId?.trim() || TEST_CLIENT_LOOKUP_ID;

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['profile', 'client', adminId, clientId],
    queryFn: () => getClientProfileSafe(adminId, clientId),
    enabled: !isHydrating && Boolean(adminId && clientId),
    retry: 2,
  });

  const client = data?.profile ?? null;
  const loadError = data?.errorMessage ?? (isError ? String(error) : null);

  const familyLabel = client?.familyLabel || 'Family';
  const displayName = (client?.displayName || sessionProfile?.name || '').trim() || '—';

  const openSection = useCallback(
    (section: ProfileMenuSectionId) => {
      router.push(`/profile/${section}`);
    },
    [router],
  );

  const menuItems = useMemo(() => {
    const count = client?.travellerCount;

    return PROFILE_MENU_ITEMS.map((item) => {
      const subtitle =
        item.id === 'travellers' && typeof count === 'number' && count > 0
          ? `${count} travellers - details, documents, loyalty, preferences`
          : item.subtitle;

      return {
        key: item.id,
        icon: item.icon,
        title: item.title,
        subtitle,
        onPress: () => openSection(item.id),
      };
    });
  }, [client?.travellerCount, openSection]);

  if (isHydrating || (isPending && !client && !loadError)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingHorizontal: pagePad,
          maxWidth: contentMax,
          alignSelf: 'center',
          width: '100%',
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text
          style={[styles.title, { fontSize: titleSize, lineHeight: titleSize + 6 }]}
          accessibilityRole="header"
        >
          Profile
        </Text>
        <Text style={styles.family} selectable>
          {familyLabel}
        </Text>
      </View>

      {loadError && !client ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Text style={styles.errorHint} selectable>
            adminId: {adminId} · clientId: {clientId}
          </Text>
          <Pressable onPress={() => void refetch()} style={styles.retry}>
            <Text style={styles.retryLabel}>{isFetching ? 'Retrying…' : 'Retry'}</Text>
          </Pressable>
        </View>
      ) : (
        <ProfileAccountCard
          displayName={displayName}
          contactEmail={client?.contactEmail ?? sessionProfile?.contactEmail ?? null}
          accountRole={client?.accountRole ?? null}
          directorName={client?.directorName ?? null}
          directorTitle={client?.directorTitle ?? null}
        />
      )}

      <ProfileMenuCard items={menuItems} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: TAB_BAR_CLEARANCE,
    gap: 16,
  },
  hero: {
    gap: 6,
    marginBottom: 4,
  },
  title: {
    fontFamily: fontFamily.cormorant.regular,
    color: colors.forest,
  },
  family: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 15,
    lineHeight: 20,
    color: colors.muted,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorBox: {
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 20,
    gap: 10,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  errorHint: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
    textAlign: 'center',
  },
  retry: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 14,
    color: colors.forest,
  },
});
