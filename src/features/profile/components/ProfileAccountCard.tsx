/**
 * Profile identity card — dark forest premium shell.
 * Same backend props; layout matches Profile mock (avatar · family · name · role · email).
 * Visual styles on View; Pressable not used here.
 */
import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type ProfileAccountCardProps = {
  familyLabel: string;
  displayName: string;
  contactEmail: string | null;
  accountRole: string | null;
  directorName: string | null;
  directorTitle: string | null;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts[parts.length - 1]?.charAt(0) ?? '';
  return `${first}${last}`.toUpperCase();
}

export function ProfileAccountCard({
  familyLabel,
  displayName,
  contactEmail,
  accountRole,
  directorName,
  directorTitle,
}: ProfileAccountCardProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 360;
  const stack = width < 380;

  const padH = isCompact ? 18 : width >= 768 ? 26 : 22;
  const padV = isCompact ? 20 : width >= 768 ? 26 : 22;
  const avatarSize = isCompact ? 56 : 64;

  const name = displayName.trim();
  const initials = initialsFromName(name);
  const family = familyLabel.trim();
  const showDirector = Boolean(directorName?.trim());
  /** Never invent a name — card only renders fields that exist on the fetched profile. */
  const hasIdentityCopy = Boolean(family || name || accountRole?.trim() || contactEmail?.trim());

  return (
    <View
      style={[styles.card, { paddingHorizontal: padH, paddingTop: padV, paddingBottom: padV }]}
      accessibilityRole="summary"
    >
      <View pointerEvents="none" style={styles.shieldWatermark}>
        <Feather name="shield" size={148} color="rgba(247, 246, 244, 0.07)" />
      </View>

      <View style={[styles.row, stack && styles.rowStack]}>
        <View style={[styles.identityRow, stack && styles.identityRowStack]}>
          <View
            style={[
              styles.avatar,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
              },
            ]}
          >
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>

          <View style={styles.copyCol}>
            {family ? (
              <Text style={styles.familyEyebrow} numberOfLines={1}>
                {family}
              </Text>
            ) : null}

            {name ? (
              <Text style={styles.name} selectable numberOfLines={2}>
                {name}
              </Text>
            ) : null}

            {accountRole?.trim() ? (
              <View style={styles.rolePill}>
                <Text style={styles.rolePillLabel} numberOfLines={2}>
                  {accountRole.trim()}
                </Text>
              </View>
            ) : null}

            {contactEmail?.trim() ? (
              <Text style={styles.email} selectable numberOfLines={2}>
                {contactEmail.trim()}
              </Text>
            ) : null}

            {!hasIdentityCopy ? (
              <Text style={styles.email}>Profile details unavailable</Text>
            ) : null}
          </View>
        </View>

        {showDirector ? (
          <View style={[styles.directorCol, stack && styles.directorColStack]}>
            <Text style={[styles.directorEyebrow, !stack && styles.alignRight]}>YOUR DIRECTOR</Text>
            <Text
              style={[styles.directorName, !stack && styles.alignRight]}
              selectable
              numberOfLines={2}
            >
              {directorName}
            </Text>
            {directorTitle?.trim() ? (
              <Text
                style={[styles.directorTitle, !stack && styles.alignRight]}
                selectable
                numberOfLines={2}
              >
                {directorTitle.trim()}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: colors.forest,
    overflow: 'hidden',
    position: 'relative',
  },
  shieldWatermark: {
    position: 'absolute',
    right: -18,
    bottom: -28,
    opacity: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    zIndex: 1,
  },
  rowStack: {
    flexDirection: 'column',
  },
  identityRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    minWidth: 0,
  },
  identityRowStack: {
    width: '100%',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(247, 246, 244, 0.22)',
  },
  avatarInitials: {
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 15,
    lineHeight: 18,
    color: colors.forest,
  },
  copyCol: {
    flex: 1,
    minWidth: 0,
    gap: 8,
    paddingTop: 2,
  },
  familyEyebrow: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(247, 246, 244, 0.55)',
  },
  name: {
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 22,
    lineHeight: 28,
    color: colors.primaryForeground,
  },
  rolePill: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(61, 79, 56, 0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(216, 205, 184, 0.28)',
  },
  rolePillLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 10,
    lineHeight: 13,
    color: 'rgba(247, 246, 244, 0.88)',
  },
  email: {
    marginTop: 2,
    fontFamily: fontFamily.manrope.regular,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(247, 246, 244, 0.62)',
  },
  directorCol: {
    flexShrink: 1,
    minWidth: 112,
    maxWidth: '38%',
    paddingTop: 4,
    zIndex: 1,
  },
  directorColStack: {
    maxWidth: '100%',
    width: '100%',
    minWidth: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(247, 246, 244, 0.14)',
    paddingTop: 14,
    marginTop: 4,
  },
  directorEyebrow: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 9,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: 'rgba(247, 246, 244, 0.45)',
    marginBottom: 8,
  },
  directorName: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 14,
    lineHeight: 19,
    color: colors.primaryForeground,
    marginBottom: 4,
  },
  directorTitle: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(247, 246, 244, 0.58)',
  },
  alignRight: {
    textAlign: 'right',
  },
});
