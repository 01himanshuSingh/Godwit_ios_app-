/**
 * Full-screen Godwit bird loader for screen boot (first paint).
 * Section waits use feature skeletons — not this component.
 */
import { StyleSheet, View } from 'react-native';

import { GodwitOfficialLoader } from '@/ui/brand/GodwitOfficialLoader';
import { colors } from '@/ui/tokens/colors';

type ScreenBootLoaderProps = {
  accessibilityLabel?: string;
};

export function ScreenBootLoader({ accessibilityLabel = 'Loading Godwit' }: ScreenBootLoaderProps) {
  return (
    <View style={styles.root} accessibilityRole="progressbar">
      <GodwitOfficialLoader variant="screen" accessibilityLabel={accessibilityLabel} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background,
  },
});
