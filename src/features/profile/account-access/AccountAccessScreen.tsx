/**
 * Profile → Account access — who may use this Godwit account.
 * Shows the signed-in client as Principal until delegate APIs exist.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  AccountAccessMemberCard,
  type AccountAccessMember,
} from '@/features/profile/account-access/components/AccountAccessMemberCard';
import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';
import { getClientProfileSafe } from '@/lib/firebase/clients';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { isScreenBooting, ScreenBootLoader } from '@/ui/loading';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

const PRINCIPAL_ACCESS_SUMMARY =
  'Full access to trips, requests, approvals, documents and finances.';

export function AccountAccessScreen() {
  const { profile: sessionProfile, isHydrating } = useActiveClientProfile();

  const adminId = sessionProfile?.adminId?.trim() ?? '';
  const clientId = sessionProfile?.clientId?.trim() ?? '';
  const hasScope = Boolean(adminId && clientId);

  const profileQuery = useQuery({
    queryKey: ['profile', 'client', adminId, clientId],
    queryFn: () => getClientProfileSafe(adminId, clientId),
    enabled: !isHydrating && hasScope,
    retry: 2,
  });

  const client = profileQuery.data?.profile ?? null;
  const loading = isScreenBooting({
    isHydrating,
    enabled: hasScope,
    isPending: profileQuery.isPending,
    hasContent: Boolean(client),
    hasTerminalError: profileQuery.isError,
  });

  const principalMember = useMemo((): AccountAccessMember | null => {
    const name = client?.displayName?.trim() || sessionProfile?.name?.trim() || '';
    const email = client?.contactEmail?.trim() || sessionProfile?.contactEmail?.trim() || null;

    if (!name && !email) {
      return null;
    }

    return {
      id: clientId || 'principal',
      name: name || 'Account holder',
      email,
      roleLabel: 'Principal',
      accessSummary: PRINCIPAL_ACCESS_SUMMARY,
      canRemove: false,
    };
  }, [client, clientId, sessionProfile]);

  const members = useMemo(() => (principalMember ? [principalMember] : []), [principalMember]);

  if (loading) {
    return <ScreenBootLoader accessibilityLabel="Loading account access" />;
  }

  const showEmpty = members.length === 0 && (profileQuery.isError || Boolean(profileQuery.data));

  return (
    <ProfileSectionShell
      title="Account access"
      subtitle="Everyone who may use this Godwit account."
      layoutPreset="travellers"
    >
      {members.length > 0 ? <AccountAccessMemberCard members={members} /> : null}

      {showEmpty ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No account holders found</Text>
          <Text style={styles.emptyBody}>
            We couldn’t load who may use this Godwit account. Try again from Profile.
          </Text>
        </View>
      ) : null}
    </ProfileSectionShell>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderStyle: 'dashed',
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.forest,
  },
  emptyBody: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
});
