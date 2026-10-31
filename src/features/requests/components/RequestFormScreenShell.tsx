/**
 * Shared chrome for service request forms (Hotel, Flight, …).
 * ProfileSectionShell + “Change what you need” back to category grid.
 */
import Feather from '@expo/vector-icons/Feather';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

const TAB_BAR_CLEARANCE = 96;

type RequestFormScreenShellProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
  clearTabBar?: boolean;
  children: ReactNode;
};

export function RequestFormScreenShell({
  title,
  subtitle = 'A few lines is enough. Leave anything you are unsure about blank.',
  onBack,
  clearTabBar = false,
  children,
}: RequestFormScreenShellProps) {
  return (
    <ProfileSectionShell
      title={title}
      subtitle={subtitle}
      backLabel="Requests"
      onBack={onBack}
      contentBottomInset={clearTabBar ? TAB_BAR_CLEARANCE : 0}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change what you need"
        onPress={onBack}
        hitSlop={8}
        style={styles.changePressable}
      >
        <View style={styles.changeRow}>
          <Feather name="chevron-left" size={18} color={colors.accent} />
          <Text style={styles.changeLabel}>Change what you need</Text>
        </View>
      </Pressable>

      {children}
    </ProfileSectionShell>
  );
}

const styles = StyleSheet.create({
  changePressable: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  changeLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.accent,
  },
});
