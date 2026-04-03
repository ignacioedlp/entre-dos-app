import { TextStyle } from 'react-native';

export type TypographyVariant =
  | 'swissTitle'
  | 'cardLabel'
  | 'cardTitle'
  | 'body'
  | 'bodyBold'
  | 'button'
  | 'heading'
  | 'caption'
  | 'label';

export interface VariantStyle {
  fontFamily: string;
  fontWeight: TextStyle['fontWeight'];
  fontSize: number;
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: TextStyle['textTransform'];
  opacity?: number;
}

export const typographyVariants: Record<TypographyVariant, VariantStyle> = {
  heading: {
    fontFamily: 'Inter_900Black',
    fontWeight: '900',
    fontSize: 28,
    letterSpacing: -0.5,
  },
  swissTitle: {
    fontFamily: 'Inter_900Black',
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: -1,
    textTransform: 'uppercase',
  },
  cardLabel: {
    fontFamily: 'Inter_900Black',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    opacity: 0.5,
  },
  cardTitle: {
    fontFamily: 'Inter_900Black',
    fontWeight: '900',
    fontSize: 22,
    lineHeight: 22,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
  },
  bodyBold: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  caption: {
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 18,
  },
  label: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.8,
  },
};
