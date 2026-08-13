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
export const CARD_WIDTH = SCREEN_WIDTH * 0.56;
export const CARD_HEIGHT = CARD_WIDTH * (4 / 3);
const SIDE_SCALE = 0.82;
const SIDE_ROTATION = 8;

const RARITY_MAP: Record<string, RarityKey> = {
  common: 'comun',
  rare: 'rara',
  epic: 'epica',
  legendary: 'legendaria',
};

interface CylinderCardProps {
  card: DeckCard;
  index: number;
  rotation: SharedValue<number>;
  dragY: SharedValue<number>;
  activeIndex: SharedValue<number>;
  onTap: () => void;
}

export function CylinderCard({
  card,
  index,
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
    const position = index - rotation.value;
    const distance = Math.abs(position);
    const visible = distance < 1.5;
    const scale = interpolate(distance, [0, 1, 1.5], [1, SIDE_SCALE, 0.7], Extrapolation.CLAMP);
    const opacity = interpolate(distance, [0, 1, 1.5], [1, 0.9, 0], Extrapolation.CLAMP);
    const isActive = activeIndex.value === index;
    const y = isActive ? dragY.value : 0;
    const zIndex = Math.round((2 - distance) * 100);
    const shadowOpacity = interpolate(distance, [0, 1], [0.5, 0.2], Extrapolation.CLAMP);

    return {
      transform: [
        { translateX: position * CARD_WIDTH },
        { translateY: y },
        { rotateZ: `${position * SIDE_ROTATION}deg` },
        { scale },
      ],
      opacity: visible ? opacity : 0,
      zIndex,
      shadowColor: glow,
      shadowOpacity,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
      elevation: visible ? Math.round((2 - distance) * 10) : 0,
      pointerEvents: visible ? 'auto' : 'none',
    };
  });

  return (
    <Animated.View style={[styles.cardSlot, animStyle]}>
      <Pressable onPress={onTap}>
        <GameCard
          card={{
            rarity,
            category: card.category,
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
