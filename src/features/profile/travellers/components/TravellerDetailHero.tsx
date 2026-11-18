/**
 * Traveller detail hero — dark forest identity card.
 * Only shows name / relationship when present; privacy note is static chrome.
 */
import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type TravellerDetailHeroProps = {
  fullName: string | null;
  relationship: string | null;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts[parts.length - 1]?.charAt(0) ?? '';
  return `${first}${last}`.toUpperCase();
}

export function TravellerDetailHero({ fullName, relationship }: TravellerDetailHeroProps) {
  const name = fullName?.trim() || '';
  const role = relationship?.trim() || '';
  const initials = initialsFromName(name);

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>

        <View style={styles.copy}>
          {name ? (
            <Text style={styles.name} numberOfLines={2}>
              {name}
            </Text>
          ) : null}
          {role ? (
            <Text style={styles.role} numberOfLines={1}>
              {role}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.privacyRow}>
        <Feather name="lock" size={11} color="rgba(247, 246, 244, 0.55)" />
        <Text style={styles.privacyLabel}>Numbers are always masked</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: colors.forest,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
  },
  avatarInitials: {
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 18,
    lineHeight: 22,
    color: colors.forest,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 24,
    lineHeight: 30,
    color: colors.primaryForeground,
  },
  role: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(247, 246, 244, 0.7)',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  privacyLabel: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 11,
    lineHeight: 14,
    color: 'rgba(247, 246, 244, 0.55)',
  },
});
