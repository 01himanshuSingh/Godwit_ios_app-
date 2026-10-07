import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CurrentTripCard } from '@/features/home/components/CurrentTripCard';
import { GreetingSection } from '@/features/home/components/GreetingSection';
import { HomeHeader } from '@/features/home/components/HomeHeader';
import { NewRequestButton } from '@/features/home/components/NewRequestButton';
import { staticHomeViewModel } from '@/features/home/schemas/homeViewModel';
import { useGodwitFonts } from '@/ui/fonts/useGodwitFonts';
import { colors } from '@/ui/tokens/colors';

const TAB_BAR_CLEARANCE = 96;

export function HomeScreen() {
  const fontsLoaded = useGodwitFonts();
  const homeData = staticHomeViewModel;

  const handleNewRequest = useCallback(() => {
    // Placeholder — wired to requests flow after auth/session.
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <HomeHeader
          notificationsCount={homeData.notificationsCount}
          profileInitials={homeData.profileInitials}
        />
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GreetingSection
          familyName={homeData.familyName}
          greeting={homeData.greeting}
          userName={homeData.userName}
          updatesCount={homeData.updatesCount}
        />
        <NewRequestButton onPress={handleNewRequest} />
        <CurrentTripCard trip={homeData.currentTrip} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeTop: {
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
