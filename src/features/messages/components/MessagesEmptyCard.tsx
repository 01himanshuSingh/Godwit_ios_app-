/**
 * Messages tab empty / pre-module state.
 * Honest coming-soon card — no invented threads.
 */
import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type FeatherName = ComponentProps<typeof Feather>['name'];

const PREVIEWS: { icon: FeatherName; label: string; hint: string }[] = [
  {
    icon: 'message-circle',
    label: 'Team chat',
    hint: 'Direct lines with your Godwit desk',
  },
  {
    icon: 'map',
    label: 'Trip threads',
    hint: 'Questions tied to live itineraries',
  },
  {
    icon: 'paperclip',
    label: 'Shared files',
    hint: 'Confirmations and notes in one place',
  },
];

export function MessagesEmptyCard() {
  const { width } = useWindowDimensions();
  const narrow = width < 360;
  const pad = narrow ? 18 : 22;

  return (
    <View style={styles.stack} accessibilityRole="summary">
      <View
        style={[styles.heroCard, { paddingHorizontal: pad, paddingVertical: narrow ? 26 : 30 }]}
      >
        <View style={styles.noticeRow}>
          <View style={styles.noticeIcon}>
            <Feather name="message-square" size={11} color={colors.muted} />
          </View>
          <Text style={styles.noticeLabel}>COMING SOON</Text>
        </View>

        <View style={styles.iconWell}>
          <Feather name="message-square" size={24} color={colors.forest} />
        </View>

        <Text style={[styles.title, { fontSize: narrow ? 20 : 22, lineHeight: narrow ? 26 : 28 }]}>
          Conversations arrive soon
        </Text>
        <Text style={styles.body}>
          When messaging is live, you’ll talk with your Godwit travel team here — trip questions,
          updates, and shared files in one thread.
        </Text>
      </View>

      <View style={styles.previewCard}>
        <Text style={styles.previewEyebrow}>WHAT YOU’LL SEE</Text>
        {PREVIEWS.map((item, index) => (
          <View key={item.label}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <View style={styles.previewRow}>
              <View style={styles.previewIcon}>
                <Feather name={item.icon} size={16} color={colors.forest} />
              </View>
              <View style={styles.previewCopy}>
                <Text style={styles.previewLabel}>{item.label}</Text>
                <Text style={styles.previewHint}>{item.hint}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    width: '100%',
    gap: 14,
  },
  heroCard: {
    width: '100%',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 12,
  },
  noticeRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  noticeIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
  },
  noticeLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.muted,
  },
  iconWell: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
    marginTop: 4,
  },
  title: {
    fontFamily: fontFamily.cormorant.medium,
    color: colors.forest,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  body: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 4,
  },
  previewCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  previewEyebrow: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 9,
    letterSpacing: 0.9,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
    flexShrink: 0,
  },
  previewCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  previewLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.forest,
  },
  previewHint: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 52,
  },
});
