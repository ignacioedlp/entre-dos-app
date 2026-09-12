import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { rarityColor, rarityTextColor, RarityKey } from '../../constants/colors';
import { Typography } from '../ui/Typography';
import { CategoryWatermark } from './CategoryWatermark';

export interface EventBadgeData {
  icon: string;
  name: string;
  color: string;
}

export interface GameCardData {
  rarity: RarityKey;
  category?: 'action' | 'home' | 'date';
  label: string; // e.g. "LEGENDARIA"
  title: string; // e.g. "MASAJE 10 MINUTOS"
  description?: string;
  packIcon?: string;
  event?: EventBadgeData | null;
  extraLabel?: string;
  specialWatermark?: 'sparkles';
}

interface GameCardProps {
  card: GameCardData;
  width?: number;
  rotation?: number; // degrees for scattered layout
  style?: object;
  variant?: 'full' | 'thumbnail';
}

function contrastingTextColor(backgroundColor: string) {
  const value = backgroundColor.trim();
  const match = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);

  if (!match) return '#ffffff';

  const hex =
    match[1].length === 3
      ? match[1]
          .split('')
          .map((character) => character + character)
          .join('')
      : match[1];
  const channels = [0, 2, 4].map((offset) => {
    const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  const whiteContrast = 1.05 / (luminance + 0.05);
  const darkContrast = (luminance + 0.05) / 0.05;

  return darkContrast >= whiteContrast ? '#0f1115' : '#ffffff';
}

export function GameCard({
  card,
  width = 10,
  rotation = 0,
  style,
  variant = 'full',
}: GameCardProps) {
  const bg = rarityColor[card.rarity];
  const fg = rarityTextColor[card.rarity];
  const eventTextColor = card.event ? contrastingTextColor(card.event.color) : fg;
  const h = width * (4 / 3);
  const watermarkSize = Math.round(width * 0.4);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          width,
          height: h,
          backgroundColor: bg,
          borderRadius: variant === 'thumbnail' ? 12 : 24,
          transform: [{ rotate: `${rotation}deg` }],
        },
        style,
      ]}
    >
      {/* Diagonal glare overlay — top-left highlight */}
      <LinearGradient
        colors={['rgba(255,255,255,0.20)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {card.category && (
        <Animated.View style={styles.watermark} pointerEvents="none">
          <CategoryWatermark category={card.category} color={fg} size={watermarkSize} />
        </Animated.View>
      )}

      {card.specialWatermark && (
        <Animated.View style={styles.watermark} pointerEvents="none">
          <Ionicons name={card.specialWatermark} color={fg} size={watermarkSize} />
        </Animated.View>
      )}

      {variant === 'full' && (
        <Animated.View style={styles.inner}>
          {/* Rarity label */}
          <Animated.View style={{ gap: 10 }}>
            {/* Event badge — top-left corner */}
            <Animated.View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                width: '100%',
              }}
            >
              <Typography variant="cardLabel" color={fg}>
                {card.label}
              </Typography>

              {(card.event || card.extraLabel) && (
                <Animated.View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: card.event ? card.event.color : 'transparent',
                      borderColor: card.event ? card.event.color : fg + '55',
                    },
                  ]}
                >
                  <Typography
                    variant="cardLabel"
                    color={eventTextColor}
                    baseFontSize={9}
                    style={{ opacity: 1, letterSpacing: 1.5 }}
                  >
                    {card.extraLabel ?? card.event?.name}
                  </Typography>
                </Animated.View>
              )}
            </Animated.View>
            <Typography
              variant="cardTitle"
              color={fg}
              baseFontSize={24}
              baseLineHeight={28}
              numberOfLines={4}
            >
              {card.title}
            </Typography>
          </Animated.View>
          <Typography
            variant="body"
            color={fg}
            baseFontSize={14}
            baseLineHeight={18}
            numberOfLines={4}
          >
            {card.description}
          </Typography>
        </Animated.View>
      )}

      {variant === 'thumbnail' && (
        <Animated.View style={styles.thumbnailInner}>
          <Typography
            variant="cardTitle"
            color={fg}
            baseFontSize={18}
            baseLineHeight={21}
            numberOfLines={2}
          >
            {card.title}
          </Typography>
          <Typography
            variant="body"
            color={fg}
            baseFontSize={12}
            baseLineHeight={15}
            numberOfLines={3}
          >
            {card.description}
          </Typography>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 18,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  watermark: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.11,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  thumbnailInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
});
