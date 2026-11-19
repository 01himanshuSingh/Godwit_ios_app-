/**
 * Account access — white member card (name · email · role · rights · actions).
 * Matches Travellers / Payments list card surfaces.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

export type AccountAccessMember = {
  id: string;
  name: string;
  email: string | null;
  roleLabel: string;
  accessSummary: string;
  /** Principal cannot be removed from the account. */
  canRemove?: boolean;
};

type AccountAccessMemberCardProps = {
  members: AccountAccessMember[];
  onChangeAccess?: (member: AccountAccessMember) => void;
  onRemoveAccess?: (member: AccountAccessMember) => void;
};

function MemberRow({
  member,
  isLast,
  onChangeAccess,
  onRemoveAccess,
}: {
  member: AccountAccessMember;
  isLast: boolean;
  onChangeAccess?: (member: AccountAccessMember) => void;
  onRemoveAccess?: (member: AccountAccessMember) => void;
}) {
  const name = member.name.trim();
  const email = member.email?.trim() || null;
  const canRemove = member.canRemove !== false;

  return (
    <View>
      <View style={styles.row} accessibilityRole="summary">
        <View style={styles.topLine}>
          <View style={styles.identityCol}>
            {name ? (
              <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail" selectable>
                {name}
              </Text>
            ) : null}
            {email ? (
              <Text style={styles.email} numberOfLines={1} ellipsizeMode="tail" selectable>
                {email}
              </Text>
            ) : null}
          </View>

          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeLabel}>{member.roleLabel}</Text>
          </View>
        </View>

        {member.accessSummary.trim() ? (
          <Text style={styles.accessSummary}>{member.accessSummary.trim()}</Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Change access for ${name || 'member'}`}
            onPress={() => onChangeAccess?.(member)}
            style={({ pressed }) => [styles.actionPressable, pressed && styles.actionPressed]}
          >
            <Text style={styles.actionLabel}>Change access</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              canRemove
                ? `Remove access for ${name || 'member'}`
                : 'Principal access cannot be removed'
            }
            accessibilityState={{ disabled: !canRemove }}
            disabled={!canRemove}
            onPress={() => onRemoveAccess?.(member)}
            style={({ pressed }) => [
              styles.actionPressable,
              pressed && canRemove && styles.actionPressed,
            ]}
          >
            <Text style={[styles.actionLabel, !canRemove && styles.actionLabelDisabled]}>
              Remove access
            </Text>
          </Pressable>
        </View>
      </View>

      {!isLast ? <View style={styles.divider} /> : null}
    </View>
  );
}

export function AccountAccessMemberCard({
  members,
  onChangeAccess,
  onRemoveAccess,
}: AccountAccessMemberCardProps) {
  if (members.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      {members.map((member, index) => (
        <MemberRow
          key={member.id}
          member={member}
          isLast={index === members.length - 1}
          onChangeAccess={onChangeAccess}
          onRemoveAccess={onRemoveAccess}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 12,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  identityCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.forest,
  },
  email: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  roleBadge: {
    flexShrink: 0,
    borderRadius: 999,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  roleBadgeLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    lineHeight: 14,
    color: colors.muted,
  },
  accessSummary: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 18,
    marginTop: 2,
  },
  actionPressable: {
    paddingVertical: 2,
  },
  actionPressed: {
    opacity: 0.65,
  },
  actionLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.forest,
  },
  actionLabelDisabled: {
    color: colors.border,
  },
  divider: {
    marginHorizontal: 18,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
