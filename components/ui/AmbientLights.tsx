import { useId } from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { useTheme } from '@/context/ThemeContext';

/** Two static pools of brand color, painted behind the screen content. */
export function AmbientLights() {
  const { colors, theme } = useTheme();
  const id = useId().replace(/:/g, '');
  const intensity = theme === 'dark' ? 0.2 : 0.075;

  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.lights}
    >
      <Svg width="100%" height="100%" viewBox="0 0 400 900" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id={`${id}-upper`}>
            <Stop offset="0" stopColor={colors.pasion} stopOpacity={intensity} />
            <Stop offset="0.4" stopColor={colors.pasion} stopOpacity={intensity * 0.45} />
            <Stop offset="1" stopColor={colors.pasion} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`${id}-lower`}>
            <Stop offset="0" stopColor={colors.pasion} stopOpacity={intensity * 0.8} />
            <Stop offset="0.4" stopColor={colors.pasion} stopOpacity={intensity * 0.3} />
            <Stop offset="1" stopColor={colors.pasion} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx="-35" cy="190" rx="350" ry="330" fill={`url(#${id}-upper)`} />
        <Ellipse cx="430" cy="710" rx="320" ry="330" fill={`url(#${id}-lower)`} />
      </Svg>
    </View>
  );
}

/** Keep the lights fixed when the screen's main container scrolls. */
export function AmbientScrollView({ style, ...props }: ScrollViewProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AmbientLights />
      <ScrollView {...props} style={[style, styles.transparent]} />
    </View>
  );
}

const styles = StyleSheet.create({
  lights: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  screen: { flex: 1 },
  transparent: { backgroundColor: 'transparent' },
});
