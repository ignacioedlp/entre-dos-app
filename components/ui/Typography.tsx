import { Animated, Text, TextProps, TextStyle, StyleProp } from 'react-native';
import { useFontScale } from '@/context/FontScaleContext';
import { useColors } from '@/context/ThemeContext';
import { TypographyVariant, typographyVariants } from '@/constants/typography';

interface TypographyProps extends Omit<TextProps, 'style'> {
  variant?: TypographyVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  /** Override the variant's base font size while still applying scale multiplier */
  baseFontSize?: number;
  /** Override the variant's base line height while still applying scale multiplier */
  baseLineHeight?: number;
  children?: React.ReactNode;
}

export function Typography({
  variant = 'body',
  color,
  style,
  baseFontSize,
  baseLineHeight,
  children,
  ...rest
}: TypographyProps) {
  const { multiplier } = useFontScale();
  const colors = useColors();
  const base = typographyVariants[variant];

  const effectiveFontSize = baseFontSize ?? base.fontSize;
  const effectiveLineHeight = baseLineHeight ?? base.lineHeight;

  const scaledStyle: TextStyle = {
    fontFamily: base.fontFamily,
    fontSize: Math.round(effectiveFontSize * multiplier),
    ...(effectiveLineHeight !== undefined && {
      lineHeight: Math.round(effectiveLineHeight * multiplier),
    }),
    ...(base.letterSpacing !== undefined && { letterSpacing: base.letterSpacing }),
    ...(base.textTransform !== undefined && { textTransform: base.textTransform }),
    ...(base.opacity !== undefined && { opacity: base.opacity }),
    color: color ?? colors.textPrimary,
  };

  return (
    <Text style={[scaledStyle, style]} {...rest}>
      {children}
    </Text>
  );
}

export const AnimatedTypography = Animated.createAnimatedComponent(Typography);
