import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { rarityColor, rarityTextColor, RarityKey } from '../../constants/colors';

export interface GameCardData {
  rarity: RarityKey;
  label: string; // e.g. "LEGENDARIA"
  title: string; // e.g. "MASAJE 10 MINUTOS"
  description?: string;
  packIcon?: string;
}

interface GameCardProps {
  card: GameCardData;
  width?: number;
  rotation?: number; // degrees for scattered layout
  style?: object;
}

export function GameCard({ card, width = 160, rotation = 0, style }: GameCardProps) {
  const bg = rarityColor[card.rarity];
  const fg = rarityTextColor[card.rarity];
  const h = width * (4 / 3);
  const iconSize = Math.round(width * 0.6);
  const iconColor = rarityTextColor[card.rarity] + '33';

  return (
    <Animated.View
      style={[
        styles.card,
        {
          width,
          height: h,
          backgroundColor: bg,
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

      {/* Pack icon — shown when card belongs to a non-base deck */}
      {card.packIcon && (
        <Animated.View style={styles.packIconContainer} pointerEvents="none">
          <Ionicons name={card.packIcon as any} size={iconSize} color={iconColor} />
        </Animated.View>
      )}

      <Animated.View style={styles.inner}>
        {/* Rarity label */}
        <Animated.View style={{ gap: 10 }}>
          <Animated.Text style={[styles.label, { color: fg }]}>{card.label}</Animated.Text>
          <Animated.Text style={[styles.title, { color: fg }]} numberOfLines={4}>
            {card.title}
          </Animated.Text>
        </Animated.View>

        {/* Card subtitle — bottom */}
        <Animated.Text style={[styles.description, { color: fg }]} numberOfLines={4}>
          {card.description}
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 18,
  },
  packIconContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.12,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: 'Inter_900Black',
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    opacity: 0.5,
  },
  title: {
    fontFamily: 'Inter_900Black',
    fontSize: 24,
    lineHeight: 28,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 18,
  },
});
