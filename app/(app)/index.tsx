import { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import { WeekTimeline } from '../../components/cards/WeekTimeline';
import {
  CylinderCard,
  CARD_HEIGHT,
  CARD_WIDTH,
  getAnglePerCard,
  getCylinderRadius,
} from '../../components/carousel/CylinderCard';
import { PartnerLastPlay } from '../../components/cards/PartnerLastPlay';
import { AllPlayedState } from '../../components/home/AllPlayedState';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { apiGetDeck, apiGetHistory, DeckCard } from '../../lib/api';
import { useNotificationList } from '../../hooks/use-notification-list';
import { Typography } from '../../components/ui/Typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HOME_AUTO_REFRESH_MS = 30_000;

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation('home');

  const { data, isLoading } = useQuery({
    queryKey: ['deck'],
    queryFn: apiGetDeck,
    refetchInterval: HOME_AUTO_REFRESH_MS,
    refetchIntervalInBackground: false,
  });

  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['deck-history'],
    queryFn: apiGetHistory,
    refetchInterval: HOME_AUTO_REFRESH_MS,
    refetchIntervalInBackground: false,
  });

  const { hasUnread } = useNotificationList();

  const allCards = data?.cards ?? [];
  const cards = allCards
    .filter((c) => c.status !== 'played')
    .sort((a, b) => {
      // Event cards first, then normal cards
      const aIsEvent = a.event !== null && a.event !== undefined;
      const bIsEvent = b.event !== null && b.event !== undefined;
      if (aIsEvent && !bIsEvent) return -1;
      if (!aIsEvent && bIsEvent) return 1;
      return 0; // preserve order for same category
    });
  const cardsRef = useRef<DeckCard[]>([]);
  cardsRef.current = cards;

  const anglePerCard = getAnglePerCard(cards.length);
  const cylinderRadius = getCylinderRadius(cards.length);
  const dragToAngle = anglePerCard / CARD_WIDTH;

  const rotation = useSharedValue(0);
  const baseRotation = useSharedValue(0);
  const dragY = useSharedValue(0);

  const chevron1Opacity = useSharedValue(1);
  const chevron2Opacity = useSharedValue(1);
  const chevron3Opacity = useSharedValue(1);

  useEffect(() => {
    const pulse = withRepeat(
      withSequence(withTiming(0.15, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      false
    );
    chevron1Opacity.value = withDelay(0, pulse);
    chevron2Opacity.value = withDelay(300, pulse);
    chevron3Opacity.value = withDelay(600, pulse);
  }, [chevron1Opacity, chevron2Opacity, chevron3Opacity]);

  const chevron1Style = useAnimatedStyle(() => ({ opacity: chevron1Opacity.value }));
  const chevron2Style = useAnimatedStyle(() => ({ opacity: chevron2Opacity.value * 0.45 }));
  const chevron3Style = useAnimatedStyle(() => ({ opacity: chevron3Opacity.value * 0.25 }));

  function navigateToCard(card: DeckCard) {
    router.push(`/play-card/?data=${encodeURIComponent(JSON.stringify(card))}`);
  }

  function doNavigate(card: DeckCard) {
    dragY.value = withTiming(0, { duration: 200 });
    navigateToCard(card);
  }

  const pan = Gesture.Pan()
    .onBegin(() => {
      baseRotation.value = rotation.value;
    })
    .onUpdate((e) => {
      const isVertical = Math.abs(e.translationY) > Math.abs(e.translationX) && e.translationY > 0;
      if (isVertical) {
        dragY.value = e.translationY;
      } else {
        dragY.value = 0;
        rotation.value = baseRotation.value + e.translationX * -dragToAngle;
      }
    })
    .onEnd(() => {
      const list = cardsRef.current;
      if (!list.length) return;

      if (dragY.value > 80) {
        const activeIdx = clamp(Math.round(rotation.value / anglePerCard), 0, list.length - 1);
        const card = list[activeIdx];
        dragY.value = withTiming(CARD_HEIGHT * 1.3, { duration: 260 }, () => {
          runOnJS(doNavigate)(card);
        });
        return;
      }

      dragY.value = withSpring(0, { damping: 18, stiffness: 200 });

      const nearest = clamp(Math.round(rotation.value / anglePerCard), 0, list.length - 1);
      rotation.value = withSpring(nearest * anglePerCard, {
        damping: 18,
        stiffness: 200,
      });
      baseRotation.value = nearest * anglePerCard;
    });

  const partnerLastPlay = historyData?.history.find((p) => p.userId !== user?.userId) ?? null;

  const showAllPlayed = !isLoading && allCards.length > 0 && cards.length === 0;
  const showNeverDealt = !isLoading && allCards.length === 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Typography variant="heading" style={styles.greeting}>{t('screen.greeting')}</Typography>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
            {hasUnread && <View style={styles.badge} />}
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={Colors.accent} size="large" />
          </View>
        ) : showNeverDealt ? (
          <View style={styles.empty}>
            <Typography variant="heading" baseFontSize={48} style={styles.emoji}>🃏</Typography>
            <Typography variant="swissTitle" style={styles.emptyTitle}>{t('screen.emptyTitle')}</Typography>
            <Typography variant="body" baseFontSize={15} baseLineHeight={22} color={Colors.textSecondary} style={styles.emptyBody}>{t('screen.emptyDescription')}</Typography>
          </View>
        ) : showAllPlayed ? (
          <AllPlayedState />
        ) : (
          <View style={styles.carouselSection}>
            {partnerLastPlay && <PartnerLastPlay play={partnerLastPlay} />}
            <View style={styles.container}>
              <View style={styles.sectionHeader}>
                <Typography variant="cardLabel" color={Colors.textMuted} style={{ opacity: 1, letterSpacing: 2.5 }}>{t('screen.deckTitle')}</Typography>
              </View>
              <View style={styles.divider} />
            </View>
            <GestureDetector gesture={pan}>
              <Animated.View style={styles.carouselHitArea}>
                <View style={styles.carouselStage}>
                  {cards.map((card, i) => (
                    <CylinderCard
                      key={card.id}
                      card={card}
                      index={i}
                      cardCount={cards.length}
                      anglePerCard={anglePerCard}
                      cylinderRadius={cylinderRadius}
                      rotation={rotation}
                      dragY={dragY}
                    />
                  ))}
                </View>
              </Animated.View>
            </GestureDetector>

            <View style={styles.hint}>
              <Typography variant="body" baseFontSize={14} baseLineHeight={20} color={Colors.textSecondary} style={styles.hintText}>{t('screen.deckHint')}</Typography>
              <View style={styles.chevrons}>
                <Animated.View style={chevron1Style}>
                  <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
                </Animated.View>
                <Animated.View style={[chevron2Style, { marginTop: -10 }]}>
                  <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
                </Animated.View>
                <Animated.View style={[chevron3Style, { marginTop: -10 }]}>
                  <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
                </Animated.View>
              </View>
            </View>
          </View>
        )}

        <WeekTimeline
          plays={historyData?.history ?? []}
          isLoading={isHistoryLoading}
          currentUserId={user?.userId ?? ''}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 20,
  },
  container: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  eventCountPill: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  greeting: {
    marginBottom: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  emoji: {
    marginBottom: 8,
    textTransform: 'none',
    letterSpacing: 0,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyBody: {
    textAlign: 'center',
    maxWidth: 280,
  },
  carouselSection: {
    flex: 1,
  },
  carouselHitArea: {
    width: SCREEN_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselStage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 48,
  },
  hintText: {
    textAlign: 'center',
    marginBottom: 10,
  },
  chevrons: {
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.pasion,
  },
});
