import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Toast } from 'toastify-react-native';
import * as Sentry from '@sentry/react-native';

import { Pack } from '../../lib/api';
import { useRevenueCat } from '../../context/RevenueCatContext';
import { Typography } from '../ui/Typography';

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
  onPress?: () => void;
}

export function PackCard({ pack, half, isPremium, onPress }: PackCardProps) {
  const theme = getPackTheme(pack.color);
  const cardWidth = half ? HALF_CARD : SCREEN_WIDTH - CARD_PADDING * 2;
  const { t } = useTranslation('home');
  const { presentPaywallIfNeeded } = useRevenueCat();

  function formatPrice(isBase: boolean): string {
    return isBase ? t('packs.free') : t('packs.premium');
  }

  async function handleSubscribe() {
    try {
      await presentPaywallIfNeeded();
    } catch (e) {
      Sentry.captureException(e, {
        tags: {
          area: 'subscriptions',
          flow: 'packSubscribeTap',
        },
        extra: {
          packId: pack.id,
          packName: pack.name,
        },
      });
      Toast.error(t('paywall.error'));
    }
  }

  const content = (
    <>
      <Typography variant="label" color={theme.subText} style={styles.priceLabel}>
        {formatPrice(pack.isBase)}
      </Typography>
      <Typography variant="swissTitle" color={theme.text} baseFontSize={18} style={styles.packName}>
        {pack.name.toUpperCase()}
      </Typography>
      <Typography variant="label" color={theme.subText} style={styles.packSubtitle}>
        {pack.subtitle.toUpperCase()}
      </Typography>

      <View style={styles.cardSpacer} />

      <Typography
        variant="body"
        color={theme.subText}
        baseFontSize={13}
        baseLineHeight={18}
        style={styles.packQuote}
      >
        {'"'}
        {pack.description}
        {'"'}
      </Typography>

      {!pack.isBase && !isPremium && (
        <TouchableOpacity
          style={[styles.buyButton, { backgroundColor: theme.btnBg }]}
          activeOpacity={0.85}
          onPress={handleSubscribe}
        >
          <Typography
            variant="cardLabel"
            color={theme.btnText}
            style={{ opacity: 1, letterSpacing: 1.5 }}
          >
            {t('packs.subscribe')}
          </Typography>
        </TouchableOpacity>
      )}
    </>
  );

  const cardStyle = [styles.card, { backgroundColor: theme.bg, width: cardWidth }];
  if (onPress) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.85}
        onPress={onPress}
        style={cardStyle}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    minHeight: 220,
  },
  priceLabel: {
    marginBottom: 6,
    letterSpacing: 1.5,
  },
  packName: {
    letterSpacing: -0.5,
    lineHeight: 28,
    marginBottom: 4,
  },
  packSubtitle: {
    letterSpacing: 2,
  },
  cardSpacer: {
    flex: 1,
    minHeight: 24,
  },
  packQuote: {
    fontStyle: 'italic',
    marginBottom: 16,
  },
  buyButton: {
    borderRadius: 100,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
