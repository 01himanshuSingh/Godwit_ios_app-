/**
 * Maps /profile/[section] → feature screen.
 */
import type { ComponentType } from 'react';
import { Text, View } from 'react-native';

import { AccountAccessScreen } from '@/features/profile/account-access';
import { DocumentsScreen } from '@/features/profile/documents';
import {
  isProfileMenuSectionId,
  type ProfileMenuSectionId,
} from '@/features/profile/menu/profileMenuItems';
import { NotificationsScreen } from '@/features/profile/notifications';
import { PaymentsScreen } from '@/features/profile/payments';
import { SecurityScreen } from '@/features/profile/security';
import { SupportScreen } from '@/features/profile/support';
import { TravellersScreen } from '@/features/profile/travellers';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

const SECTION_SCREENS: Record<ProfileMenuSectionId, ComponentType> = {
  travellers: TravellersScreen,
  payments: PaymentsScreen,
  documents: DocumentsScreen,
  notifications: NotificationsScreen,
  'account-access': AccountAccessScreen,
  security: SecurityScreen,
  support: SupportScreen,
};

type ProfileSectionRouterProps = {
  section: string;
};

export function ProfileSectionRouter({ section }: ProfileSectionRouterProps) {
  if (!isProfileMenuSectionId(section)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text
          style={{
            fontFamily: fontFamily.manrope.medium,
            fontSize: 15,
            color: colors.muted,
            textAlign: 'center',
          }}
        >
          Unknown profile section.
        </Text>
      </View>
    );
  }

  const Screen = SECTION_SCREENS[section];
  return <Screen />;
}
