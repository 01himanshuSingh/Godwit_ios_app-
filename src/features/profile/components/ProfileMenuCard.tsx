/**
 * Profile hub menu — grouped section cards (Travel / Billing / Account).
 * Visual styles on View; Pressable is a plain touch wrapper.
 */
import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ProfileMenuIcon } from '@/features/profile/menu/profileMenuItems';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

export type ProfileMenuTrailing =
  | { kind: 'text'; label: string }
  | { kind: 'badge'; label: string }
  | { kind: 'secured' }
  | { kind: 'dot' };

export type ProfileMenuCardItem = {
  key: string;
  icon: ProfileMenuIcon;
  title: string;
  subtitle: string;
  trailing?: ProfileMenuTrailing | null;
  onPress?: () => void;
};

export type ProfileMenuGroupCard = {
  key: string;
  title: string;
  trailing?: string | null;
  items: ProfileMenuCardItem[];
};

type ProfileMenuCardProps = {
  groups?: ProfileMenuGroupCard[] | null;
};

function TrailingMeta({ trailing }: { trailing: ProfileMenuTrailing }) {
  if (trailing.kind === 'badge') {
    return (
      <View style={styles.activeBadge}>
        <Text style={styles.activeBadgeLabel}>{trailing.label}</Text>
      </View>
    );
  }
  if (trailing.kind === 'secured') {
    return (
      <View style={styles.securedRow}>
        <Feather name="lock" size={11} color={colors.muted} />
        <Text style={styles.metaText}>Secured</Text>
      </View>
    );
  }
  if (trailing.kind === 'dot') {
    return <View style={styles.alertDot} />;
  }
  return (
    <Text style={styles.metaText} numberOfLines={1}>
      {trailing.label}
    </Text>
  );
}

function MenuRow({ item, isLast }: { item: ProfileMenuCardItem; isLast: boolean }) {
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${item.subtitle}`}
        onPress={item.onPress}
        style={styles.rowPressable}
      >
        <View style={styles.row}>
          <View style={styles.iconWell}>
            <Feather name={item.icon} size={18} color={colors.forest} />
          </View>

          <View style={styles.copyCol}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.rowSubtitle} numberOfLines={2}>
              {item.subtitle}
            </Text>
          </View>

          <View style={styles.trailingCol}>
            {item.trailing ? <TrailingMeta trailing={item.trailing} /> : null}
            <Feather name="chevron-right" size={16} color="#C4C0B8" />
          </View>
        </View>
      </Pressable>
      {!isLast ? <View style={styles.divider} /> : null}
    </View>
  );
}

export function ProfileMenuCard({ groups }: ProfileMenuCardProps) {
  const safeGroups = Array.isArray(groups) ? groups : [];

  return (
    <View style={styles.root}>
      {safeGroups.map((group) => {
        const items = Array.isArray(group.items) ? group.items : [];
        return (
          <View key={group.key} style={styles.group}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              {group.trailing ? (
                <Text style={styles.groupTrailing} numberOfLines={1}>
                  {group.trailing}
                </Text>
              ) : null}
            </View>

            <View style={styles.card}>
              {items.map((item, index) => (
                <MenuRow key={item.key} item={item} isLast={index === items.length - 1} />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: 18,
  },
  group: {
    gap: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 2,
  },
  groupTitle: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    color: colors.muted,
  },
  groupTrailing: {
    flexShrink: 1,
    fontFamily: fontFamily.manrope.medium,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.8,
    color: colors.muted,
    textAlign: 'right',
  },
  card: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  rowPressable: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  copyCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  rowTitle: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.forest,
  },
  rowSubtitle: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
  },
  trailingCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  metaText: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    lineHeight: 14,
    color: colors.muted,
    maxWidth: 96,
  },
  activeBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(61, 79, 56, 0.12)',
  },
  activeBadgeLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 10,
    lineHeight: 12,
    color: colors.accent,
  },
  securedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.forest,
  },
  divider: {
    marginLeft: 66,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
