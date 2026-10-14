import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      {/* Fill lives on View — Pressable + overflow can drop backgroundColor on RN. */}
      <View style={styles.button}>
        <Feather name="plus" size={18} color={colors.sand} strokeWidth={2.25} />
        <Text style={styles.label}>New request</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'flex-start',
    marginHorizontal: 24,
    marginTop: 22,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    minHeight: 46,
    paddingLeft: 14,
    paddingRight: 16,
    paddingVertical: 12,
    borderRadius: 23,
    backgroundColor: colors.forest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accent,
  },
  label: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 15,
    letterSpacing: 0.2,
    color: colors.sand,
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.88,
  },
});
