import { StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { GameCard } from '../cards/GameCard';
import { RarityKey, rarityGlow } from '../../constants/colors';
import { DeckCard } from '../../lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const CARD_WIDTH = SCREEN_WIDTH * 0.68;
export const CARD_HEIGHT = CARD_WIDTH * (4 / 3);

const CYLINDER_RADIUS = CARD_WIDTH * 0.62;
export const ANGLE_PER_CARD = 42;

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
  rotation: Animated.SharedValue<number>;
  dragY: Animated.SharedValue<number>;
}

export function CylinderCard({ card, index, rotation, dragY }: CylinderCardProps) {
  const rarity = RARITY_MAP[card.rarity] ?? 'comun';
  const glow = rarityGlow[rarity];
  const { t } = useTranslation('common');

  const categoryLabel = t(`category.${card.category}`, {
    defaultValue: card.category.toUpperCase(),
  });

  const animStyle = useAnimatedStyle(() => {
    const angleDeg = index * ANGLE_PER_CARD - rotation.value;
    const rad = toRad(angleDeg);
    const x = Math.sin(rad) * CYLINDER_RADIUS;
    const depth = Math.cos(rad);
    const visible = depth > -0.2;

    const scale = interpolate(depth, [-0.2, 0, 1], [0.55, 0.72, 1], Extrapolation.CLAMP);
    const opacity = interpolate(depth, [-0.2, 0.2, 1], [0, 0.55, 1], Extrapolation.CLAMP);
    const zIndex = Math.round(depth * 100);
    const shadowOpacity = interpolate(depth, [0, 1], [0, 0.55], Extrapolation.CLAMP);

    const isActive = Math.round(rotation.value / ANGLE_PER_CARD) === index;
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
      pointerEvents: depth > 0.85 ? 'auto' : 'none',
    };
  });

  return (
    <Animated.View style={[styles.cardSlot, animStyle]}>
      <GameCard
        card={{
          rarity,
          label: categoryLabel,
          title: card.title,
          description: card.description,
          packIcon: card.packIcon,
        }}
        width={CARD_WIDTH}
      />
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
