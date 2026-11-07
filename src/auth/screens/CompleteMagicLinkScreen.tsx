/**
 * Expo Go / early-dev handoff: paste Firebase magic link after Gmail copy.
 * Production / Dev Client: deep link will call the same complete path; this UI can hide.
 */
import * as Clipboard from 'expo-clipboard';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  type AppStateStatus,
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
import { isFirebaseMagicLink } from '@/auth/services/magicLink/completeMagicLink';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

export function CompleteMagicLinkScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    pendingAuth,
    pendingMagicLinkEmail,
    completeMagicLinkSignIn,
    clearPendingMagicLink,
    magicLinkError,
    clearMagicLinkError,
  } = useAuth();

  const email = pendingAuth?.email ?? pendingMagicLinkEmail ?? '';
  const [link, setLink] = useState('');
  const [focused, setFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    let cancelled = false;
    const readFromClipboard = () => {
      void Clipboard.getStringAsync()
        .then((raw) => {
          const text = raw.trim();
          if (!cancelled && text && isFirebaseMagicLink(text)) {
            setLink(text);
          }
        })
        .catch(() => {
          // Clipboard permission / empty — ignore
        });
    };

    readFromClipboard();

    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        readFromClipboard();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  async function onVerify() {
    setLocalError(null);
    clearMagicLinkError();
    const trimmed = link.trim();
    if (!trimmed) {
      setLocalError('Paste the sign-in link from your email.');
      return;
    }

    setSubmitting(true);
    try {
      await completeMagicLinkSignIn(trimmed);
      router.replace('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed.';
      setLocalError(message);
      if (/Request a new link|expired|already used/i.test(message)) {
        // AuthGate will send user to sign-in once pending is cleared.
        router.replace('/(auth)/sign-in' as Href);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function onDifferentEmail() {
    await clearPendingMagicLink();
    router.replace('/(auth)/sign-in' as Href);
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
            <Text style={styles.eyebrow}>CHECK YOUR EMAIL</Text>
            <Text style={styles.title}>Complete sign-in</Text>
            <Text style={styles.subtitle}>
              We sent a sign-in link to {email || 'your email'}.{' '}
              {__DEV__
                ? 'In Gmail, long-press the Sign in button and choose Copy link address (do NOT tap/open it in the browser, or the one-time code will be consumed).'
                : 'Open the email on this device and tap the sign-in link to continue.'}
            </Text>
          </View>

          <View style={styles.card}>
            {__DEV__ ? (
              <>
                <Text style={styles.label}>Magic link (Dev)</Text>
                <TextInput
                  style={[styles.input, styles.linkInput, focused && styles.inputFocused]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                  value={link}
                  onChangeText={setLink}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  editable={!submitting}
                  placeholder="Paste the full Firebase sign-in link"
                  placeholderTextColor={colors.muted}
                  accessibilityLabel="Magic link"
                />

                {errorText ? (
                  <Text style={styles.error} accessibilityRole="alert">
                    {errorText}
                  </Text>
                ) : (
                  <Text style={styles.hint}>
                    Do not open the link in Safari/Chrome first — long-press → Copy link address,
                    then return here.
                  </Text>
                )}

                <Pressable
                  style={[styles.button, submitting && styles.buttonDisabled]}
                  onPress={() => void onVerify()}
                  disabled={submitting || !link.trim()}
                  accessibilityRole="button"
                  accessibilityLabel="Verify and sign in"
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.primaryForeground} />
                  ) : (
                    <Text style={styles.buttonLabel}>Verify and sign in</Text>
                  )}
                </Pressable>
              </>
            ) : errorText ? (
              <Text style={styles.error} accessibilityRole="alert">
                {errorText}
              </Text>
            ) : (
              <Text style={styles.hint}>
                Waiting for you to tap the sign-in link in your email…
              </Text>
            )}

            <Pressable
              style={styles.secondary}
              onPress={() => void onDifferentEmail()}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel="Use a different email"
            >
              <Text style={styles.secondaryLabel}>Use a different email</Text>
            </Pressable>
          </View>

          {__DEV__ ? (
            <Text style={styles.footer}>Development handoff — paste replaces automatic open.</Text>
          ) : (
            <Text style={styles.footer}>Private access for Godwit clients only.</Text>
          )}
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
  linkInput: {
    minHeight: 96,
    textAlignVertical: 'top',
    fontSize: 13,
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
  secondary: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 14,
    color: colors.accent,
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
