import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeHeader } from '@/features/home/components/HomeHeader';
import { useAppHeaderState } from '@/features/home/hooks/useAppHeaderState';
import { colors } from '@/ui/tokens/colors';

/** GODWIT header + safe area — use on every app surface (tabs + stack pages). */
export function AppChromeHeader() {
  const { notificationsCount, profileInitials } = useAppHeaderState();

  return (
    <SafeAreaView style={styles.safeTop} edges={['top']}>
      <HomeHeader notificationsCount={notificationsCount} profileInitials={profileInitials} />
    </SafeAreaView>
  );
}

/** For embedding when parent already owns SafeAreaView. */
export function AppChromeHeaderBar() {
  const { notificationsCount, profileInitials } = useAppHeaderState();

  return (
    <View style={styles.bar}>
      <HomeHeader notificationsCount={notificationsCount} profileInitials={profileInitials} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeTop: {
    backgroundColor: colors.background,
  },
  bar: {
    backgroundColor: colors.background,
  },
});
