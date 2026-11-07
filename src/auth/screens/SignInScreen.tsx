/**
 * Magic-link sign-in for Godwit clients (Expo Go: paste link on complete-login).
 */
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/providers/AuthProvider';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

function mapSendLinkError(error: unknown): string {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: string }).code ?? '')
      : '';
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const lower = `${code} ${raw}`.toLowerCase();

  if (
    lower.includes('does not belong') ||
    lower.includes('no godwit client') ||
    lower.includes('no client')
  ) {
    return 'This email does not belong to a Godwit client.';
  }
  if (lower.includes('operation-not-allowed')) {
    return __DEV__
      ? 'Firebase Email link sign-in is not enabled yet (Authentication → Sign-in method → Email/Password → enable Email link).'
      : 'Sign-in isn’t available right now. Please try again shortly.';
  }
  if (lower.includes('unauthorized-continue-uri') || lower.includes('invalid-continue-uri')) {
    return __DEV__
      ? `Continue URL domain is not authorized in Firebase Auth (${raw}).`
      : 'We couldn’t send a sign-in link. Please try again.';
  }
  if (lower.includes('too-many-requests') || lower.includes('quota')) {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }
  if (lower.includes('network') || lower.includes('offline') || lower.includes('unavailable')) {
    return 'Connection issue. Check your network and try again.';
  }
  if (lower.includes('invalid-email') || lower.includes('valid email')) {
    return 'Enter a valid email address.';
  }
  if (__DEV__ && (code || raw)) {
    return `We couldn’t send a sign-in link (${code || raw}).`;
  }
  return 'We couldn’t send a sign-in link. Please try again.';
}

export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sendMagicLinkEmail, magicLinkError, clearMagicLinkError } = useAuth();
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function onContinue() {
    setLocalError(null);
    clearMagicLinkError();
    const trimmed = email.trim();
    if (!trimmed.includes('@')) {
      setLocalError('Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      await sendMagicLinkEmail(trimmed);
      router.replace('/(auth)/complete-login' as Href);
    } catch (err) {
      setLocalError(mapSendLinkError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const errorText = localError ?? magicLinkError;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBand} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: Math.max(insets.bottom, 24) + 16 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.brand} accessibilityRole="header">
              GODWIT
            </Text>
            <Text style={styles.eyebrow}>CLIENT ACCESS</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              We’ll email you a sign-in link for the address on your Godwit account.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, focused && styles.inputFocused]}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              editable={!submitting}
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
              accessibilityLabel="Email address"
              onSubmitEditing={() => void onContinue()}
              returnKeyType="go"
            />

            {errorText ? (
              <Text style={styles.error} accessibilityRole="alert">
                {errorText}
              </Text>
            ) : (
              <Text style={styles.hint}>Use the same email your Godwit team has on file.</Text>
            )}

            <Pressable
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={() => void onContinue()}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel="Continue with email"
            >
              {submitting ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={styles.buttonLabel}>Continue</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.footer}>Private access for Godwit clients only.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  topBand: {
    height: 6,
    backgroundColor: colors.sand,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
  },
  hero: {
    marginBottom: 28,
  },
  brand: {
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: 5,
    color: colors.forest,
    marginBottom: 20,
  },
  eyebrow: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 10,
  },
  title: {
    fontFamily: fontFamily.cormorant.regular,
    fontSize: 34,
    lineHeight: 40,
    color: colors.forest,
  },
  subtitle: {
    marginTop: 10,
    fontFamily: fontFamily.manrope.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
    maxWidth: 340,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 22,
    shadowColor: colors.forest,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  label: {
    marginBottom: 8,
    fontFamily: fontFamily.manrope.medium,
    fontSize: 13,
    color: colors.accent,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fontFamily.manrope.regular,
    fontSize: 16,
    color: colors.forest,
  },
  inputFocused: {
    borderColor: colors.accent,
  },
  hint: {
    marginTop: 12,
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  error: {
    marginTop: 12,
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#8B4A3F',
  },
  button: {
    marginTop: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: colors.forest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accent,
    paddingVertical: 14,
  },
  buttonDisabled: {
    opacity: 0.72,
  },
  buttonLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 16,
    color: colors.sand,
  },
  footer: {
    marginTop: 28,
    textAlign: 'center',
    fontFamily: fontFamily.manrope.regular,
    fontSize: 12,
    letterSpacing: 0.2,
    color: colors.muted,
  },
});
