/**
 * ACCOUNT card — matches Profile mock:
 * left: name (serif) / email / role · right: YOUR DIRECTOR (right-aligned)
 */
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type ProfileAccountCardProps = {
  displayName: string;
  contactEmail: string | null;
  accountRole: string | null;
  directorName: string | null;
  directorTitle: string | null;
};

export function ProfileAccountCard({
  displayName,
  contactEmail,
  accountRole,
  directorName,
  directorTitle,
}: ProfileAccountCardProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 360;
  const stack = width < 340;
  const nameSize = isCompact ? 24 : width >= 768 ? 30 : 28;
  const emailSize = isCompact ? 13 : 14;
  const directorNameSize = isCompact ? 14 : 15;
  const directorTitleSize = isCompact ? 12 : 13;
  const padH = isCompact ? 18 : width >= 768 ? 26 : 22;
  const padV = isCompact ? 18 : width >= 768 ? 24 : 20;

  const showDirector = Boolean(directorName?.trim());

  return (
    <View
      style={[styles.card, { paddingHorizontal: padH, paddingTop: padV, paddingBottom: padV + 2 }]}
      accessibilityRole="summary"
    >
      <View style={[styles.columns, stack && styles.columnsStack]}>
        <View style={[styles.accountCol, !stack && showDirector && styles.accountColWithDirector]}>
          <Text style={styles.eyebrow}>ACCOUNT</Text>
          <Text
            style={[styles.name, { fontSize: nameSize, lineHeight: nameSize + 4 }]}
            selectable
            numberOfLines={2}
          >
            {displayName || '—'}
          </Text>
          {contactEmail ? (
            <Text
              style={[styles.meta, { fontSize: emailSize, lineHeight: emailSize + 6 }]}
              selectable
              numberOfLines={2}
            >
              {contactEmail}
            </Text>
          ) : null}
          {accountRole ? (
            <Text
              style={[styles.meta, { fontSize: emailSize, lineHeight: emailSize + 6 }]}
              selectable
              numberOfLines={2}
            >
              {accountRole}
            </Text>
          ) : null}
        </View>

        {showDirector ? (
          <View style={[styles.directorCol, stack && styles.directorColStack]}>
            <Text style={[styles.eyebrow, !stack && styles.alignRight]}>YOUR DIRECTOR</Text>
            <Text
              style={[
                styles.directorName,
                { fontSize: directorNameSize, lineHeight: directorNameSize + 5 },
                !stack && styles.alignRight,
              ]}
              selectable
              numberOfLines={2}
            >
              {directorName}
            </Text>
            {directorTitle ? (
              <Text
                style={[
                  styles.directorTitle,
                  { fontSize: directorTitleSize, lineHeight: directorTitleSize + 4 },
                  !stack && styles.alignRight,
                ]}
                selectable
                numberOfLines={2}
              >
                {directorTitle}
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
    borderRadius: 20,
    backgroundColor: '#F8F7F4',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  columnsStack: {
    flexDirection: 'column',
    gap: 20,
  },
  accountCol: {
    flex: 1,
    minWidth: 0,
  },
  accountColWithDirector: {
    flexGrow: 1.15,
    flexShrink: 1,
    paddingRight: 4,
  },
  directorCol: {
    flexGrow: 0.85,
    flexShrink: 1,
    minWidth: 118,
    maxWidth: '42%',
  },
  directorColStack: {
    maxWidth: '100%',
    width: '100%',
    minWidth: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  eyebrow: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  name: {
    fontFamily: fontFamily.cormorant.medium,
    color: colors.forest,
    marginBottom: 6,
  },
  meta: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
    marginTop: 2,
  },
  directorName: {
    fontFamily: fontFamily.manrope.semibold,
    color: colors.forest,
    marginBottom: 4,
  },
  directorTitle: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
  },
  alignRight: {
    textAlign: 'right',
  },
});
