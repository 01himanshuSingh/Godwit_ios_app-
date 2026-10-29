import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { HomeTabBar } from '@/features/home/components/HomeTabBar';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { TestingClientsScreen } from '@/features/home/screens/TestingClientsScreen';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { TripsScreen } from '@/features/trips/screens/TripsScreen';
import { useGodwitFonts } from '@/ui/fonts/useGodwitFonts';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type MainTabKey = 'home' | 'trips' | 'messages' | 'profile' | 'testing';

function PlaceholderTab({ title }: { title: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{title} — coming soon</Text>
    </View>
  );
}

export function MainTabScreen() {
  const fontsLoaded = useGodwitFonts();
  const [activeTab, setActiveTab] = useState<MainTabKey>('home');

  const handleTabPress = useCallback((tabKey: string) => {
    setActiveTab(tabKey as MainTabKey);
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
      {/* AppChromeHeader lives in app/_layout.tsx — every route. */}
      <View style={styles.body}>
        {activeTab === 'home' ? <HomeScreen /> : null}
        {activeTab === 'testing' ? <TestingClientsScreen /> : null}
        {activeTab === 'trips' ? <TripsScreen /> : null}
        {activeTab === 'messages' ? <PlaceholderTab title="Messages" /> : null}
        {activeTab === 'profile' ? <ProfileScreen /> : null}
      </View>

      <HomeTabBar activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 96,
  },
  placeholderText: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 15,
    color: colors.muted,
  },
});
