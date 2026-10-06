import '../../global.css';

import 'react-native-gesture-handler';

import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';

import { AppProviders } from '@/providers/AppProviders';

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 18, marginBottom: 12 }}>Something went wrong</Text>
      <Pressable
        onPress={retry}
        style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#111' }}
      >
        <Text style={{ color: '#fff' }}>Retry</Text>
      </Pressable>
    </View>
  );
}
