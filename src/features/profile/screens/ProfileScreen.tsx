/**
 * Profile tab — client scope same as Trips.
 * Never invents another guest’s identity when load fails / scope missing.
 * Menu rows navigate to /profile/[section] feature screens.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useAuth } from '@/auth/providers/AuthProvider';
import { useHomeTabBarScrollProps } from '@/features/home/tabBar/HomeTabBarVisibility';
import { ProfileAccountCard } from '@/features/profile/components/ProfileAccountCard';
import { ProfileExceptionCard } from '@/features/profile/components/ProfileExceptionCard';
import { ProfileHubFooter } from '@/features/profile/components/ProfileHubFooter';
import {
  ProfileMenuCard,
  type ProfileMenuCardItem,
  type ProfileMenuGroupCard,
  type ProfileMenuTrailing,
} from '@/features/profile/components/ProfileMenuCard';
import { ProfileSupportCard } from '@/features/profile/components/ProfileSupportCard';
import {
  getProfileMenuItem,
  PROFILE_MENU_GROUPS,
  type ProfileMenuSectionId,
} from '@/features/profile/menu/profileMenuItems';
import { getClientProfileSafe } from '@/lib/firebase/clients';
import { classifyProfileLoadError } from '@/lib/firebase/clients/mapProfileLoadError';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { isScreenBooting, ScreenBootLoader } from '@/ui/loading';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

const TAB_BAR_CLEARANCE = 24;

function trailingForItem(
  id: ProfileMenuSectionId,
  travellerCount: number | null | undefined,
): ProfileMenuTrailing | null {
  if (id === 'travellers' && typeof travellerCount === 'number' && travellerCount > 0) {
    return { kind: 'badge', label: `${travellerCount} Active` };
  }
  return null;
}

export function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const { width } = useWindowDimensions();
  const { profile: sessionProfile, isHydrating } = useActiveClientProfile();
  const tabBarScroll = useHomeTabBarScrollProps();
  const [signingOut, setSigningOut] = useState(false);

  const pagePad = width < 360 ? 16 : width >= 768 ? 40 : 24;
  const contentMax = Math.min(width, width >= 768 ? 680 : width);
  const showLedgerBadge = width >= 360;

  const adminId = sessionProfile?.adminId?.trim() ?? '';
  const clientId = sessionProfile?.clientId?.trim() ?? '';
  const hasScope = Boolean(adminId && clientId);

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['profile', 'client', adminId, clientId],
    queryFn: () => getClientProfileSafe(adminId, clientId),
    enabled: !isHydrating && hasScope,
    retry: 2,
  });

  /** Only real fetched profile — never TEST / session invent for the identity card. */
  const client = data?.profile ?? null;
  const rawError = data?.errorMessage ? new Error(data.errorMessage) : isError ? error : null;
  /** Classify only — never surface raw error / adminId / clientId in the UI. */
  const hasLoadFailure = Boolean(rawError) || (Boolean(data) && !client);
  const errorKind = rawError
    ? classifyProfileLoadError(rawError)
    : hasLoadFailure
      ? 'unknown'
      : null;

  const openSection = useCallback(
    (section: ProfileMenuSectionId) => {
      router.push(`/profile/${section}`);
    },
    [router],
  );

  const menuGroups = useMemo((): ProfileMenuGroupCard[] => {
    return PROFILE_MENU_GROUPS.map((group) => {
      const items: ProfileMenuCardItem[] = group.itemIds.map((id) => {
        const def = getProfileMenuItem(id);
        return {
          key: def.id,
          icon: def.icon,
          title: def.title,
          subtitle: def.subtitle,
          trailing: trailingForItem(id, client?.travellerCount),
          onPress: () => openSection(def.id),
        };
      });

      return {
        key: group.id,
        title: group.title,
        trailing: group.trailing ?? null,
        items,
      };
    });
  }, [client?.travellerCount, openSection]);

  const onSignOut = useCallback(() => {
    void (async () => {
      setSigningOut(true);
      try {
        await signOut();
        queryClient.clear();
        router.replace('/(auth)/sign-in');
      } finally {
        setSigningOut(false);
      }
    })();
  }, [queryClient, router, signOut]);

  const showIdentityCard = Boolean(client);
  const showException = !isHydrating && !isPending && !showIdentityCard;

  if (
    isScreenBooting({
      isHydrating,
      enabled: hasScope,
      isPending,
      hasContent: Boolean(client),
      hasTerminalError: hasLoadFailure,
    })
  ) {
    return <ScreenBootLoader accessibilityLabel="Loading your Godwit profile" />;
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
      onScroll={tabBarScroll.onScroll}
      scrollEventThrottle={tabBarScroll.scrollEventThrottle}
    >
      <View style={styles.hero}>
        <View style={styles.heroTitleRow}>
          <Text style={styles.title} accessibilityRole="header">
            Profile
          </Text>
          {showLedgerBadge ? (
            <View style={styles.ledgerBadge}>
              <Text style={styles.ledgerBadgeLabel} numberOfLines={1}>
                LEDGER INTEGRATION PREVIEW — OPTIONAL
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.heroSubtitle}>Private Client Desk & Ledger Portal</Text>
      </View>

      {!hasScope ? <ProfileExceptionCard variant="missing_scope" /> : null}

      {hasScope && showException ? (
        <ProfileExceptionCard
          variant={errorKind === 'not_found' ? 'not_found' : 'load_error'}
          isRetrying={isFetching}
          onRetry={() => void refetch()}
        />
      ) : null}

      {showIdentityCard && client ? (
        <ProfileAccountCard
          familyLabel={client.familyLabel?.trim() || ''}
          displayName={client.displayName?.trim() || ''}
          contactEmail={client.contactEmail?.trim() || null}
          accountRole={client.accountRole?.trim() || null}
          directorName={client.directorName?.trim() || null}
          directorTitle={client.directorTitle?.trim() || null}
        />
      ) : null}

      <ProfileMenuCard groups={menuGroups ?? []} />

      <ProfileSupportCard onOpenSupport={() => openSection('support')} />

      <ProfileHubFooter isSigningOut={signingOut} onSignOut={onSignOut} />
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
    gap: 20,
  },
  hero: {
    gap: 8,
    marginBottom: 4,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flexShrink: 1,
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 26,
    lineHeight: 32,
    color: colors.forest,
  },
  ledgerBadge: {
    flexShrink: 1,
    maxWidth: '52%',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ledgerBadgeLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.3,
    color: colors.muted,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
});
