// TEMP: delete on Day 2 when tab shell is built

import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { env } from '@/config/env';

const sampleSchema = z.object({ ok: z.literal(true) });

function SmokeRow({ label, pass }: { label: string; pass: boolean }) {
  return (
    <Text accessibilityRole="text">
      {label}: {pass ? 'OK' : 'FAIL'}
    </Text>
  );
}

export default function TempTestHomeScreen() {
  const insets = useSafeAreaInsets();
  const [secureStoreOk, setSecureStoreOk] = useState<boolean | null>(null);

  const zodOk = sampleSchema.safeParse({ ok: true }).success;

  const query = useQuery({
    queryKey: ['smoke', 'static'],
    queryFn: async () => 'react-query-mounted',
  });

  useEffect(() => {
    void SecureStore.isAvailableAsync().then(setSecureStoreOk);
  }, []);

  const version = Constants.expoConfig?.version ?? 'unknown';

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 16,
        paddingHorizontal: 20,
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: '600' }} accessibilityRole="header">
        Godwit - Home (test)
      </Text>
      <Text>APP_ENV: {env.appEnv}</Text>
      <Text>API base URL: {env.apiBaseUrl}</Text>
      <Text>App version: {version}</Text>
      <View style={{ marginTop: 16, gap: 6 }}>
        <Text style={{ fontWeight: '600' }}>Smoke checks</Text>
        <SmokeRow label="Zod sample parse" pass={zodOk} />
        <SmokeRow label="React Query mounted" pass={query.isSuccess && query.data === 'react-query-mounted'} />
        <SmokeRow label="expo-secure-store available" pass={secureStoreOk === true} />
      </View>
    </ScrollView>
  );
}
