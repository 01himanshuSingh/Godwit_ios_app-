import { useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CurrentTripCard } from '@/features/home/components/CurrentTripCard';
import { GreetingSection } from '@/features/home/components/GreetingSection';
import { HomeHeader } from '@/features/home/components/HomeHeader';
import { NewRequestButton } from '@/features/home/components/NewRequestButton';
import { staticHomeViewModel } from '@/features/home/schemas/homeViewModel';
import { getClientByAdminAndClientIdSafe } from '@/lib/firebase/testing/getClientByEmail';
import {
  getProfileFirstName,
  getProfileInitial,
  greetingForLocalTime,
} from '@/lib/session/activeClientProfile';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { useGodwitFonts } from '@/ui/fonts/useGodwitFonts';
import { colors } from '@/ui/tokens/colors';

const TAB_BAR_CLEARANCE = 96;

export function HomeScreen() {
  const fontsLoaded = useGodwitFonts();
  const { profile, isHydrating } = useActiveClientProfile();
  const homeData = staticHomeViewModel;

  const handleNewRequest = useCallback(() => {
    // Placeholder — wired to requests flow after auth/session.
  }, []);

  // If Testing has never run this install, seed session from the pinned CRM client once.
  useEffect(() => {
    if (isHydrating || profile?.name.trim()) {
      return;
    }
    void getClientByAdminAndClientIdSafe();
  }, [isHydrating, profile]);

  const sessionHome = useMemo(() => {
    if (!profile?.name.trim()) {
      return null;
    }

    const firstName = getProfileFirstName(profile.name);
    const eyebrow = profile.name.trim().toUpperCase();

    return {
      familyName: eyebrow,
      userName: firstName,
      greeting: greetingForLocalTime(),
      profileInitials: getProfileInitial(profile.name),
    };
  }, [profile]);

  if (!fontsLoaded || isHydrating) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  const familyName = sessionHome?.familyName ?? homeData.familyName;
  const userName = sessionHome?.userName ?? homeData.userName;
  const greeting = sessionHome?.greeting ?? homeData.greeting;
  const profileInitials = sessionHome?.profileInitials ?? homeData.profileInitials;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <HomeHeader
          notificationsCount={homeData.notificationsCount}
          profileInitials={profileInitials}
        />
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GreetingSection
          familyName={familyName}
          greeting={greeting}
          userName={userName}
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
