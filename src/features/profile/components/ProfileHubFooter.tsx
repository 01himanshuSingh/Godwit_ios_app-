/**
 * Profile hub footer — sign out, legal chrome, portal version.
 * Visual styles on View; Pressable is a plain touch wrapper.
 */
import Feather from '@expo/vector-icons/Feather';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type ProfileHubFooterProps = {
  isSigningOut?: boolean;
  onSignOut?: () => void;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
  onJurisdictionPress?: () => void;
};

export function ProfileHubFooter({
  isSigningOut,
  onSignOut,
  onTermsPress,
  onPrivacyPress,
  onJurisdictionPress,
}: ProfileHubFooterProps) {
  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out of Sovereign Vault"
        disabled={isSigningOut}
        onPress={onSignOut}
        style={styles.signOutPressable}
      >
        <View style={styles.signOutRow}>
          {isSigningOut ? (
            <ActivityIndicator size="small" color="#8B3A3A" />
          ) : (
            <>
              <Feather name="log-out" size={14} color="#8B3A3A" />
              <Text style={styles.signOutLabel}>Sign out of Sovereign Vault</Text>
            </>
          )}
        </View>
      </Pressable>

      <View style={styles.legalRow}>
        <Pressable onPress={onTermsPress} hitSlop={6}>
          <Text style={styles.legalLink}>TERMS OF SERVICE</Text>
        </Pressable>
        <Text style={styles.legalDot}>·</Text>
        <Pressable onPress={onPrivacyPress} hitSlop={6}>
          <Text style={styles.legalLink}>PRIVACY CHARTER</Text>
        </Pressable>
        <Text style={styles.legalDot}>·</Text>
        <Pressable onPress={onJurisdictionPress} hitSlop={6}>
          <Text style={styles.legalLink}>JURISDICTION (CH)</Text>
        </Pressable>
      </View>

      <Text style={styles.version}>GODWIT CLIENT PORTAL V4.12 — GENÈVE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  signOutPressable: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 24,
  },
  signOutLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 12,
    lineHeight: 16,
    color: '#8B3A3A',
  },
  legalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  legalLink: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.6,
    color: colors.muted,
  },
  legalDot: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 9,
    color: colors.border,
  },
  version: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.8,
    color: 'rgba(92, 102, 88, 0.55)',
    textAlign: 'center',
  },
});
