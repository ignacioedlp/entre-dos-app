import { Dimensions, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { GameCard } from '../cards/GameCard';
import { RarityKey, rarityGlow } from '../../constants/colors';
import { DeckCard } from '../../lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const CARD_WIDTH = SCREEN_WIDTH * 0.68;
export const CARD_HEIGHT = CARD_WIDTH * (4 / 3);

const DEFAULT_ANGLE_PER_CARD = 42;
const MIN_ANGLE_PER_CARD = 28;
const MIN_RADIUS_FACTOR = 0.48;

export function getAnglePerCard(cardCount: number) {
  if (cardCount <= 1) {
    return DEFAULT_ANGLE_PER_CARD;
  }

  const packedAngle = 300 / Math.max(cardCount - 1, 1);
  return Math.max(MIN_ANGLE_PER_CARD, Math.min(DEFAULT_ANGLE_PER_CARD, packedAngle));
}

export function getCylinderRadius(cardCount: number) {
  const overflowCards = Math.max(cardCount - 7, 0);
  const factor = Math.max(MIN_RADIUS_FACTOR, 0.62 - overflowCards * 0.025);
  return CARD_WIDTH * factor;
}

const RARITY_MAP: Record<string, RarityKey> = {
  common: 'comun',
  rare: 'rara',
  epic: 'epica',
  legendary: 'legendaria',
};

function toRad(deg: number) {
  'worklet';
  return (deg * Math.PI) / 180;
}

interface CylinderCardProps {
  card: DeckCard;
  index: number;
  cardCount: number;
  anglePerCard: number;
  cylinderRadius: number;
  rotation: SharedValue<number>;
  dragY: SharedValue<number>;
  activeIndex: SharedValue<number>;
  onTap: () => void;
}

export function CylinderCard({
  card,
  index,
  cardCount,
  anglePerCard,
  cylinderRadius,
  rotation,
  dragY,
  activeIndex,
  onTap,
}: CylinderCardProps) {
  const rarity = RARITY_MAP[card.rarity] ?? 'comun';
  const glow = rarityGlow[rarity];
  const { t } = useTranslation('common');

  const categoryLabel = t(`category.${card.category}`, {
    defaultValue: card.category.toUpperCase(),
  });

  const animStyle = useAnimatedStyle(() => {
    const angleDeg = index * anglePerCard - rotation.value;
    const rad = toRad(angleDeg);
    const x = Math.sin(rad) * cylinderRadius;
    const depth = Math.cos(rad);
    const visibilityCutoff = cardCount > 7 ? -0.35 : -0.2;
    const visible = depth > visibilityCutoff;

    const scale = interpolate(
      depth,
      [visibilityCutoff, 0, 1],
      [0.55, 0.72, 1],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      depth,
      [visibilityCutoff, 0.2, 1],
      [0, 0.55, 1],
      Extrapolation.CLAMP
    );
    const zIndex = Math.round(depth * 100);
    const shadowOpacity = interpolate(depth, [0, 1], [0, 0.55], Extrapolation.CLAMP);

    const isActive = activeIndex.value === index;
    const isAdjacent = Math.abs(index - activeIndex.value) === 1;
    const y = isActive ? dragY.value : 0;

    return {
      transform: [
        { perspective: 900 },
        { translateX: x },
        { translateY: y },
        { rotateY: `${-angleDeg}deg` },
        { scale },
      ],
      opacity: visible ? opacity : 0,
      zIndex,
      shadowColor: glow,
      shadowOpacity,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
      elevation: visible ? Math.round(scale * 10) : 0,
      pointerEvents: isActive || isAdjacent ? 'auto' : 'none',
    };
  });

  return (
    <Animated.View style={[styles.cardSlot, animStyle]}>
      <Pressable onPress={onTap}>
        <GameCard
          card={{
            rarity,
            label: categoryLabel,
            title: card.title,
            description: card.description,
            packIcon: card.packIcon,
            event: card.event
              ? {
                  icon: card.event.icon,
                  name: card.event.name,
                  color: card.event.color,
                }
              : undefined,
          }}
          width={CARD_WIDTH}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardSlot: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
});
