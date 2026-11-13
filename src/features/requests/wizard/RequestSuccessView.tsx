import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type RequestSuccessViewProps = {
  referenceId: string;
  onViewRequest: () => void;
  onNewRequest: () => void;
};

export function RequestSuccessView({
  referenceId,
  onViewRequest,
  onNewRequest,
}: RequestSuccessViewProps) {
  return (
    <View style={styles.root}>
      <View style={styles.iconCircle}>
        <Feather name="check" size={28} color={colors.forest} />
      </View>
      <Text style={styles.title}>Request sent to Godwit</Text>
      <Text style={styles.ref}>Ref {referenceId}</Text>
      <Text style={styles.hint}>Typically answered within 2 hours</Text>

      <Pressable style={styles.primary} onPress={onViewRequest}>
        <Text style={styles.primaryLabel}>View request</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={onNewRequest}>
        <Text style={styles.secondaryLabel}>New request</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: fontFamily.cormorant.regular,
    fontSize: 28,
    color: colors.forest,
    textAlign: 'center',
  },
  ref: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 14,
    color: colors.muted,
  },
  hint: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    color: colors.muted,
    marginBottom: 16,
    textAlign: 'center',
  },
  primary: {
    width: '100%',
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 16,
    color: colors.sand,
  },
  secondary: {
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 15,
    color: colors.accent,
  },
});
