import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Pack } from '../../lib/api';
import { useRevenueCat } from '../../context/RevenueCatContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_PADDING = 24;
const HALF_CARD = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;

export interface PackTheme {
  bg: string;
  text: string;
  subText: string;
  btnBg: string;
  btnText: string;
}

export const PACK_THEMES: Record<string, PackTheme> = {
  grey: {
    bg: '#E8EBF0',
    text: '#0f1115',
    subText: 'rgba(15,17,21,0.5)',
    btnBg: '#0f1115',
    btnText: '#ffffff',
  },
  passion: {
    bg: '#FF3B5C',
    text: '#ffffff',
    subText: 'rgba(255,255,255,0.6)',
    btnBg: '#ffffff',
    btnText: '#FF3B5C',
  },
  gold: {
    bg: '#F59E0B',
    text: '#451a03',
    subText: 'rgba(69,26,3,0.6)',
    btnBg: '#0a0c10',
    btnText: '#ffffff',
  },
  purple: {
    bg: '#a855f7',
    text: '#ffffff',
    subText: 'rgba(255,255,255,0.6)',
    btnBg: '#ffffff',
    btnText: '#a855f7',
  },
  blue: {
    bg: '#38bdf8',
    text: '#0f1115',
    subText: 'rgba(15,17,21,0.5)',
    btnBg: '#0f1115',
    btnText: '#ffffff',
  },
};

const DEFAULT_THEME = PACK_THEMES['grey'];

export function getPackTheme(color?: string): PackTheme {
  if (!color) return DEFAULT_THEME;
  return PACK_THEMES[color.toLowerCase()] ?? DEFAULT_THEME;
}

interface PackCardProps {
  pack: Pack;
  half?: boolean;
  isPremium?: boolean;
}

export function PackCard({ pack, half, isPremium }: PackCardProps) {
  const theme = getPackTheme(pack.color);
  const cardWidth = half ? HALF_CARD : SCREEN_WIDTH - CARD_PADDING * 2;
  const { t } = useTranslation('home');
  const { presentPaywallIfNeeded } = useRevenueCat();

  function formatPrice(isBase: boolean): string {
    return isBase ? t('packs.free') : t('packs.premium');
  }

  async function handleSubscribe() {
    await presentPaywallIfNeeded();
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.bg, width: cardWidth }]}>
      <Text style={[styles.priceLabel, { color: theme.subText }]}>{formatPrice(pack.isBase)}</Text>
      <Text style={[styles.packName, { color: theme.text }]}>{pack.name.toUpperCase()}</Text>
      <Text style={[styles.packSubtitle, { color: theme.subText }]}>
        {pack.subtitle.toUpperCase()}
      </Text>

      <View style={styles.cardSpacer} />

      <Text style={[styles.packQuote, { color: theme.subText }]}>
        {'"'}
        {pack.description}
        {'"'}
      </Text>

      {!pack.isBase && !isPremium && (
        <TouchableOpacity
          style={[styles.buyButton, { backgroundColor: theme.btnBg }]}
          activeOpacity={0.85}
          onPress={handleSubscribe}
        >
          <Text style={[styles.buyButtonText, { color: theme.btnText }]}>
            {t('packs.subscribe')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    minHeight: 220,
  },
  priceLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  packName: {
    fontFamily: 'Inter_900Black',
    fontSize: 18,
    letterSpacing: -0.5,
    lineHeight: 28,
    marginBottom: 4,
  },
  packSubtitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  cardSpacer: {
    flex: 1,
    minHeight: 24,
  },
  packQuote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  buyButton: {
    borderRadius: 100,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buyButtonText: {
    fontFamily: 'Inter_900Black',
    fontSize: 10,
    letterSpacing: 1.5,
  },
});
