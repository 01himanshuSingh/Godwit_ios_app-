import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { HomeTabBar } from '@/features/home/components/HomeTabBar';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { TestingClientsScreen } from '@/features/home/screens/TestingClientsScreen';
import { HomeTabBarVisibilityProvider } from '@/features/home/tabBar/HomeTabBarVisibility';
import {
  isMainTabKey,
  subscribeMainTabRequest,
  takePendingMainTab,
  type MainTabKey,
} from '@/features/home/tabBar/mainTabSelection';
import { MessagesScreen } from '@/features/messages';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { TripsScreen } from '@/features/trips/screens/TripsScreen';
import { useGodwitFonts } from '@/ui/fonts/useGodwitFonts';
import { colors } from '@/ui/tokens/colors';

function MainTabBody() {
  const fontsLoaded = useGodwitFonts();
  const [activeTab, setActiveTab] = useState<MainTabKey>(() => takePendingMainTab() ?? 'home');

  useEffect(() => {
    // Initial tab already read via useState lazy init (`takePendingMainTab`).
    // Subscribe only for later requestMainTab() calls.
    return subscribeMainTabRequest((tab) => {
      setActiveTab(tab);
    });
  }, []);

  const handleTabPress = useCallback((tabKey: string) => {
    if (!isMainTabKey(tabKey)) return;
    setActiveTab(tabKey);
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
      <View style={styles.body}>
        {activeTab === 'home' ? <HomeScreen /> : null}
        {activeTab === 'testing' ? <TestingClientsScreen /> : null}
        {activeTab === 'trips' ? <TripsScreen /> : null}
        {activeTab === 'messages' ? <MessagesScreen /> : null}
        {activeTab === 'profile' ? <ProfileScreen /> : null}
      </View>

      <HomeTabBar activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
}

export function MainTabScreen() {
  return (
    <HomeTabBarVisibilityProvider>
      <MainTabBody />
    </HomeTabBarVisibilityProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
