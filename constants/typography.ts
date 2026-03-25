import { StyleSheet } from 'react-native';

/**
 * Typography styles for Entre Dos.
 * Matches the swiss-title design language used on the landing page:
 * font-weight 900, uppercase, tight line-height, -0.06em letter-spacing.
 */
export const Typography = StyleSheet.create({
  // Card title: big, bold, uppercase — main card content
  swissTitle: {
    fontFamily:    'Inter_900Black',
    fontWeight:    '900' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: -1,
  },
  // Small all-caps label above card title (rarity name)
  cardLabel: {
    fontFamily:    'Inter_900Black',
    fontWeight:    '900' as const,
    fontSize:      10,
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
    opacity:       0.5,
  },
  // Card title text
  cardTitle: {
    fontFamily:    'Inter_900Black',
    fontWeight:    '900' as const,
    fontSize:      22,
    lineHeight:    22,
    textTransform: 'uppercase' as const,
    letterSpacing: -0.5,
  },
  // Body text
  body: {
    fontFamily: 'Inter_400Regular',
    fontWeight: '400' as const,
    fontSize:   16,
    lineHeight: 24,
  },
  // Bold body
  bodyBold: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700' as const,
    fontSize:   16,
    lineHeight: 24,
  },
  // CTA button label
  button: {
    fontFamily:    'Inter_700Bold',
    fontWeight:    '700' as const,
    fontSize:      16,
    letterSpacing: 0.3,
  },
});
