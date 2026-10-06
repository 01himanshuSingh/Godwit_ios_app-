import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/providers/AuthProvider';

export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { sendMagicLinkEmail, pendingMagicLinkEmail, magicLinkError, clearMagicLinkError } =
    useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function onSendLink() {
    clearMagicLinkError();
    setLocalError(null);
    const trimmed = email.trim();
    if (!trimmed.includes('@')) {
      setLocalError('Enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      await sendMagicLinkEmail(trimmed);
      setSent(true);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Could not send magic link.');
    } finally {
      setSubmitting(false);
    }
  }

  const displayError = localError ?? magicLinkError;

  return (
    <View
      className="flex-1 bg-white px-6"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
    >
      <Text className="text-2xl font-semibold text-neutral-900" accessibilityRole="header">
        Sign in
      </Text>
      <Text className="mt-2 text-base text-neutral-600">
        We&apos;ll email you a secure link. Open it on this device to continue.
      </Text>

      <Text className="mt-6 mb-2 text-sm font-medium text-neutral-800">Email</Text>
      <TextInput
        className="rounded-lg border border-neutral-300 px-4 py-3 text-base text-neutral-900"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
        editable={!submitting}
        accessibilityLabel="Email address"
      />

      {displayError ? (
        <Text className="mt-3 text-sm text-red-600" accessibilityRole="alert">
          {displayError}
        </Text>
      ) : null}

      {sent ? (
        <Text className="mt-3 text-sm text-green-700">
          Check your inbox{pendingMagicLinkEmail ? ` (${pendingMagicLinkEmail})` : ''}. Tap the link
          to finish signing in.
        </Text>
      ) : null}

      <Pressable
        className="mt-6 items-center rounded-lg bg-neutral-900 py-3.5"
        onPress={() => void onSendLink()}
        disabled={submitting}
        accessibilityRole="button"
        accessibilityLabel="Send the magic link"
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-base font-semibold text-white">Send magic link</Text>
        )}
      </Pressable>
    </View>
  );
}
