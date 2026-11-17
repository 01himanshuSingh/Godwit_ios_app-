/**
 * "Anything to adjust?" CTA — Private Concierge Desk + Message Godwit.
 * Type scale matches hotel Active Trip (`activeTripType`).
 * Pressable is a plain touch wrapper; visuals live on View.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { activeTripType } from '@/features/trips/components/activeTripDetailTypography';
import { colors } from '@/ui/tokens/colors';

type MessageGodwitCardProps = {
  /** Static CTA — wire to messaging later. */
  onPress?: () => void;
  /** Optional desk title override. */
  deskTitle?: string;
};

export function MessageGodwitCard({
  onPress,
  deskTitle = 'Private Concierge Desk',
}: MessageGodwitCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>ANYTHING TO ADJUST?</Text>
        <Text style={styles.deskTitle} numberOfLines={2}>
          {deskTitle}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Message Godwit about this booking"
        onPress={onPress}
        style={styles.ctaPressable}
      >
        <View style={styles.cta}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.primaryForeground} />
          <Text
            style={styles.ctaLabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            Message Godwit about this booking
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: colors.sand,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 14,
  },
  copy: {
    gap: 6,
  },
  eyebrow: {
    ...activeTripType.messageEyebrow,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  deskTitle: {
    ...activeTripType.messageDeskTitle,
    color: colors.forest,
  },
  ctaPressable: {
    width: '100%',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.forest,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    minWidth: 0,
  },
  ctaLabel: {
    ...activeTripType.messageCta,
    flexShrink: 1,
    color: colors.primaryForeground,
  },
});
