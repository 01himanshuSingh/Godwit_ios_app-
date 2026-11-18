/**
 * Travellers empty success state — no linked customers for this client.
 */
import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

export function TravellersEmptyCard() {
  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.iconWell}>
        <Feather name="users" size={22} color={colors.forest} />
      </View>
      <Text style={styles.title}>No travellers linked to this client yet.</Text>
      <Text style={styles.body}>
        Liaise with your concierge to add family members or entourage manifests.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 28,
    gap: 12,
  },
  iconWell: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
    marginBottom: 4,
  },
  title: {
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 20,
    lineHeight: 26,
    color: colors.forest,
    textAlign: 'center',
  },
  body: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
});
