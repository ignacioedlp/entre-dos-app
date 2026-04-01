import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../constants/colors';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { icon: 28, text: 13 },
  md: { icon: 36, text: 16 },
  lg: { icon: 48, text: 20 },
};

export function Logo({ size = 'md', ...props }: LogoProps) {
  const { icon } = sizes[size];

  return (
    <Svg height={icon} width={icon} viewBox="0 0 100 100" fill="none" {...props}>
      <Path d="M20 30c0-11.046 8.954-20 20-20h40v15H40a5 5 0 00-5 5v15H20V30z" fill="#FF3B5C" />
      <Path d="M80 70c0 11.046-8.954 20-20 20H20V75h40a5 5 0 005-5V55h15v15z" fill="#FF3B5C" />
      <Path fill="#fff" d="M42.5 42.5H57.5V57.5H42.5z" />
    </Svg>
  );
}

export function LogoWithName({ size = 'md' }: LogoProps) {
  const { text } = sizes[size];

  return (
    <View style={styles.container}>
      {/* "S" shaped logo — matches the card back icon on the landing */}
      <Logo size={size} />
      <Text style={[styles.wordmark, { fontSize: text }]}>ENTRE DOS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordmark: {
    fontFamily: 'Inter_900Black',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
});
