/**
 * Featured Godwit Support card — sand concierge desk.
 * Visual styles on View; Pressable is a plain touch wrapper.
 */
import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type ProfileSupportCardProps = {
  onOpenSupport?: () => void;
  onDirectDispatch?: () => void;
  onStartMessaging?: () => void;
};

export function ProfileSupportCard({
  onOpenSupport,
  onDirectDispatch,
  onStartMessaging,
}: ProfileSupportCardProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>HELP & CONCIERGE DESK</Text>

      <View style={styles.card}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Godwit Support"
          onPress={onOpenSupport}
        >
          <View style={styles.topRow}>
            <View style={styles.iconOrb}>
              <Feather name="headphones" size={18} color={colors.primaryForeground} />
            </View>
            <Text style={styles.eyebrow}>24/7 DEDICATED LINE</Text>
          </View>

          <Text style={styles.title}>Godwit Support</Text>
          <Text style={styles.body}>
            Private desk direct dispatch. Average response under 90 seconds.
          </Text>
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Direct Dispatch"
            onPress={onDirectDispatch ?? onOpenSupport}
            hitSlop={8}
            style={styles.actionPressable}
          >
            <View style={styles.actionLeft}>
              <Feather name="phone" size={14} color={colors.forest} />
              <Text style={styles.actionLabel}>Direct Dispatch</Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start Telegram or Signal"
            onPress={onStartMessaging ?? onOpenSupport}
            hitSlop={8}
            style={styles.actionPressable}
          >
            <View style={styles.actionRight}>
              <Text style={styles.actionLabel}>Start Telegram / Signal</Text>
              <Feather name="arrow-up-right" size={14} color={colors.forest} />
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 10,
  },
  sectionLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    color: colors.muted,
    paddingHorizontal: 2,
  },
  card: {
    borderRadius: 20,
    backgroundColor: colors.sand,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  iconOrb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.forest,
  },
  eyebrow: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.1,
    color: colors.muted,
  },
  title: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.forest,
  },
  body: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
    marginBottom: 6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(27, 41, 21, 0.12)',
  },
  actionPressable: {
    flexShrink: 1,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.forest,
  },
});
