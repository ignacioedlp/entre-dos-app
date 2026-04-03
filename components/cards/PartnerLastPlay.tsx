import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { RarityKey, rarityColor, rarityGlow, rarityTextColor } from '../../constants/colors';
import { CardHistoryItem } from '../../lib/api';
import { Typography } from '../ui/Typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SHEEN_W = 72;
const PARTNER_CARD_W = SCREEN_WIDTH - 48;

const RARITY_MAP: Record<string, RarityKey> = {
  common: 'comun',
  rare: 'rara',
  epic: 'epica',
  legendary: 'legendaria',
};

interface PartnerLastPlayProps {
  play: CardHistoryItem;
}

export function PartnerLastPlay({ play }: PartnerLastPlayProps) {
  const rarity = RARITY_MAP[play.rarity] ?? 'comun';
  const bg = rarityColor[rarity];
  const fg = rarityTextColor[rarity];
  const glow = rarityGlow[rarity];
  const { t } = useTranslation(['home', 'common']);

  function timeAgo(iso: string): string {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return t('home:partnerLastPlay.now');
    if (mins < 60) return t('home:partnerLastPlay.minutesAgo', { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t('home:partnerLastPlay.hoursAgo', { count: hours });
    return t('home:partnerLastPlay.daysAgo', { count: Math.floor(hours / 24) });
  }

  const sheenX = useSharedValue(-SHEEN_W);
  const heartScale = useSharedValue(1);

  useEffect(() => {
    heartScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 110 }),
        withTiming(1.0, { duration: 130 }),
        withTiming(1.25, { duration: 95 }),
        withTiming(1.0, { duration: 130 }),
        withTiming(1.0, { duration: 900 })
      ),
      -1,
      false
    );
  }, [heartScale]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  useEffect(() => {
    function sweep() {
      sheenX.value = -SHEEN_W;
      sheenX.value = withDelay(
        1800,
        withTiming(PARTNER_CARD_W + SHEEN_W, { duration: 750 }, (done) => {
          if (done) runOnJS(sweep)();
        })
      );
    }
    sweep();
  }, [sheenX]);

  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sheenX.value }, { rotate: '12deg' }],
  }));

  const categoryLabel = t(`common:category.${play.category}`, {
    defaultValue: play.category.toUpperCase(),
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          shadowColor: glow,
          shadowOpacity: 0.65,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.18)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <Animated.View style={[styles.sheenStrip, sheenStyle]} pointerEvents="none">
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.26)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <View style={styles.inner}>
        <View style={styles.top}>
          <Typography variant="cardLabel" color={fg}>{categoryLabel}</Typography>
          <Typography variant="cardTitle" color={fg} baseFontSize={20} baseLineHeight={24} numberOfLines={2}>
            {play.title}
          </Typography>
          <Typography variant="cardLabel" color={fg} numberOfLines={3}>
            {play.description}
          </Typography>
        </View>

        <View style={[styles.footer, { borderTopColor: `${fg}30` }]}>
          <Typography variant="label" color={fg} baseFontSize={13}>
            {play.userName ?? t('home:partnerLastPlay.partner')}
          </Typography>
          <Typography variant="body" color={fg} baseFontSize={13} style={{ opacity: 0.5 }}>
            {' · '}
          </Typography>
          <Typography variant="body" color={fg} baseFontSize={13} style={{ opacity: 0.65 }}>
            {timeAgo(play.playedAt)}
          </Typography>
          <View style={styles.spacer} />
          <Animated.View style={heartStyle}>
            <Ionicons name="heart" size={18} color={fg} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sheenStrip: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    width: SHEEN_W,
  },
  inner: {
    padding: 18,
    gap: 14,
  },
  top: {
    gap: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  spacer: {
    flex: 1,
  },
});
