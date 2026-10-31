import Feather from '@expo/vector-icons/Feather';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { homeContentInset } from '@/features/home/layout/homeContentInset';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type NewRequestButtonProps = {
  onPress?: () => void;
};

export function NewRequestButton({ onPress }: NewRequestButtonProps) {
  const { width } = useWindowDimensions();
  const inset = useMemo(() => homeContentInset(width), [width]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="New request"
      onPress={onPress}
      style={[styles.pressable, { marginLeft: inset, marginRight: inset }]}
    >
      <View style={styles.button}>
        <Feather name="plus" size={15} color={colors.sand} strokeWidth={2.25} />
        <Text style={styles.label}>New request</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'flex-start',
    marginTop: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: 38,
    paddingLeft: 12,
    marginLeft: 18,
    marginTop: 10,
    paddingRight: 14,
    paddingVertical: 9,
    borderRadius: 19,
    backgroundColor: colors.forest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accent,
  },
  label: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 13,
    letterSpacing: 0.2,
    color: colors.sand,
    flexShrink: 0,
  },
});
