import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type NewRequestButtonProps = {
  onPress?: () => void;
};

export function NewRequestButton({ onPress }: NewRequestButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="New request"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Feather name="plus" size={18} color={colors.sand} strokeWidth={2.25} />
      <Text style={styles.label}>New request</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: 10,
    marginHorizontal: 24,
    marginTop: 22,
    minHeight: 46,
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 23,
    overflow: 'hidden',
    backgroundColor: colors.forest,
  },
  label: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 15,
    letterSpacing: 0.2,
    color: colors.sand,
  },
  pressed: {
    opacity: 0.88,
  },
});
