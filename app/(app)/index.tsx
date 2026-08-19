import { useRef, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, Pressable } from 'react-native';
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
  FadeInDown,
  ReduceMotion,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import { WeekTimeline } from '../../components/cards/WeekTimeline';
import { CylinderCard, CARD_HEIGHT } from '../../components/carousel/CylinderCard';
import { PartnerLastPlay } from '../../components/cards/PartnerLastPlay';
import { AllPlayedState } from '../../components/home/AllPlayedState';
import { useColors } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { apiGetDeck, apiGetHistory, DeckCard } from '../../lib/api';
import { useNotificationList } from '../../hooks/use-notification-list';
import { Typography } from '../../components/ui/Typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HOME_AUTO_REFRESH_MS = 30_000;
const HORIZONTAL_SWIPE_DISTANCE = 48;
const HORIZONTAL_SWIPE_VELOCITY = 500;
const homeEntrance = (delay: number) =>
  FadeInDown.delay(delay).duration(260).reduceMotion(ReduceMotion.System);

function HomeSkeleton({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View accessibilityLabel="Cargando baraja" style={styles.homeSkeleton}>
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <View style={styles.skeletonDeckLabel} />
          <View style={styles.skeletonShuffle} />
        </View>
        <View style={styles.divider} />
      </View>
      <View style={styles.skeletonCarousel}>
        <View style={[styles.skeletonSideCard, styles.skeletonSideCardLeft]} />
        <View style={styles.skeletonMainCard}>
          <View style={[styles.skeletonLine, styles.skeletonCardLabel]} />
          <View style={[styles.skeletonLine, styles.skeletonCardTitle]} />
          <View style={[styles.skeletonLine, styles.skeletonCardTitleShort]} />
          <View style={styles.skeletonCardSpacer} />
          <View style={[styles.skeletonLine, styles.skeletonCardBody]} />
          <View style={[styles.skeletonLine, styles.skeletonCardBodyShort]} />
        </View>
        <View style={[styles.skeletonSideCard, styles.skeletonSideCardRight]} />
      </View>
      <View style={styles.skeletonHint}>
        <View style={[styles.skeletonLine, styles.skeletonHintLine]} />
        <View style={styles.skeletonChevron} />
      </View>
      <View style={styles.skeletonTimeline}>
        <View style={styles.skeletonTimelineHeading} />
        <View style={styles.skeletonTimelineDivider} />
        <View style={styles.skeletonTimelineRow} />
        <View style={styles.skeletonTimelineRow} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation('home');
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

  const rotation = useSharedValue(0);
  const activeIndex = useSharedValue(0);
  const dragY = useSharedValue(0);
  const cardsForGesture = useSharedValue<DeckCard[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const activeCardIndexRef = useRef(0);
  const cardIds = cards.map((card) => card.id).join('|');

  useEffect(() => {
    const nextIndex = Math.min(
      activeCardIndexRef.current,
      Math.max(cardsRef.current.length - 1, 0)
    );

    activeCardIndexRef.current = nextIndex;
    activeIndex.value = nextIndex;
    rotation.value = nextIndex;
    dragY.value = 0;
    cardsForGesture.value = cardsRef.current;
    setActiveCardIndex(nextIndex);
  }, [activeIndex, cardIds, cardsForGesture, dragY, rotation]);

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

  function goTo(i: number) {
    if (!cardsRef.current.length) return;
    const clamped = Math.max(0, Math.min(cardsRef.current.length - 1, i));
    activeCardIndexRef.current = clamped;
    setActiveCardIndex(clamped);
    activeIndex.value = clamped;
    rotation.value = withSpring(clamped, { damping: 18, stiffness: 200 });
  }

  const orderedCards = useMemo(
    () =>
      cards
        .map((card, index) => ({ card, index }))
        // React Native draws later siblings above earlier ones. Keeping the
        // active card last prevents transformed side cards covering its edges.
        .sort(({ index: a }, { index: b }) => {
          if (a === activeCardIndex) return 1;
          if (b === activeCardIndex) return -1;
          return a - b;
        }),
    [activeCardIndex, cards]
  );

  function handleRandomCard() {
    if (!cards.length) return;
    const card = cards[Math.floor(Math.random() * cards.length)];
    doNavigate(card);
  }

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .activeOffsetY([-5, 5])
    .onUpdate((e) => {
      const isVerticalDrag = Math.abs(e.translationY) >= Math.abs(e.translationX);

      if (isVerticalDrag && e.translationY > 0) {
        dragY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      const list = cardsForGesture.value;
      if (!list.length) return;

      const isHorizontalSwipe =
        Math.abs(e.translationX) > Math.abs(e.translationY) &&
        (Math.abs(e.translationX) > HORIZONTAL_SWIPE_DISTANCE ||
          Math.abs(e.velocityX) > HORIZONTAL_SWIPE_VELOCITY);

      if (isHorizontalSwipe) {
        const direction = e.translationX < 0 ? 1 : -1;
        runOnJS(goTo)(activeIndex.value + direction);
        return;
      }

      if (dragY.value > 80) {
        const card = list[activeIndex.value];
        dragY.value = withTiming(CARD_HEIGHT * 1.3, { duration: 260 }, () => {
          runOnJS(doNavigate)(card);
        });
        return;
      }

      dragY.value = withSpring(0, { damping: 18, stiffness: 200 });
    });

  const partnerLastPlay = historyData?.history.find((p) => p.userId !== user?.userId) ?? null;

  const showAllPlayed = !isLoading && allCards.length > 0 && cards.length === 0;
  const showNeverDealt = !isLoading && allCards.length === 0;

  return (
    <View style={[createStyles(colors).root, { paddingTop: insets.top + 20 }]}>
      <Animated.View entering={homeEntrance(0)} style={createStyles(colors).header}>
        <Typography variant="heading" style={styles.greeting}>
          {t('screen.greeting')}
        </Typography>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
            {hasUnread && <View style={styles.badge} />}
          </Pressable>
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {isLoading ? (
          <HomeSkeleton styles={styles} />
        ) : showNeverDealt ? (
          <View style={styles.empty}>
            <Typography variant="heading" baseFontSize={48} style={styles.emoji}>
              🃏
            </Typography>
            <Typography variant="swissTitle" style={styles.emptyTitle}>
              {t('screen.emptyTitle')}
            </Typography>
            <Typography
              variant="body"
              baseFontSize={15}
              baseLineHeight={22}
              color={colors.textSecondary}
              style={styles.emptyBody}
            >
              {t('screen.emptyDescription')}
            </Typography>
          </View>
        ) : showAllPlayed ? (
          <AllPlayedState />
        ) : (
          <View style={styles.carouselSection}>
            {partnerLastPlay && (
              <Animated.View entering={homeEntrance(70)}>
                <PartnerLastPlay play={partnerLastPlay} />
              </Animated.View>
            )}
            <Animated.View entering={homeEntrance(100)} style={styles.container}>
              <View style={styles.sectionHeader}>
                <Typography
                  variant="cardLabel"
                  color={colors.textMuted}
                  style={{ opacity: 1, letterSpacing: 2.5 }}
                >
                  {t('screen.deckTitle')}
                </Typography>
                <Pressable
                  onPress={handleRandomCard}
                  disabled={cards.length <= 1}
                  style={{ opacity: cards.length <= 1 ? 0.3 : 1 }}
                >
                  <Ionicons name="shuffle" size={20} color={colors.textMuted} />
                </Pressable>
              </View>
              <View style={styles.divider} />
            </Animated.View>
            <Animated.View entering={homeEntrance(170)}>
              <GestureDetector gesture={pan}>
                <Animated.View style={styles.carouselHitArea}>
                  <View style={styles.carouselStage}>
                    {orderedCards.map(({ card, index }) => (
                      <CylinderCard
                        key={card.id}
                        card={card}
                        index={index}
                        rotation={rotation}
                        dragY={dragY}
                        activeIndex={activeIndex}
                        onTap={() => goTo(index)}
                      />
                    ))}
                    <Pressable
                      accessibilityLabel="Previous card"
                      disabled={activeCardIndex === 0}
                      onPress={() => goTo(activeCardIndex - 1)}
                      style={[styles.carouselNavigationZone, styles.carouselNavigationZoneLeft]}
                    />
                    <Pressable
                      accessibilityLabel="Next card"
                      disabled={activeCardIndex === cards.length - 1}
                      onPress={() => goTo(activeCardIndex + 1)}
                      style={[styles.carouselNavigationZone, styles.carouselNavigationZoneRight]}
                    />
                  </View>
                </Animated.View>
              </GestureDetector>
            </Animated.View>

            <Animated.View entering={homeEntrance(230)} style={styles.hint}>
              <Typography
                variant="body"
                baseFontSize={14}
                baseLineHeight={20}
                color={colors.textSecondary}
                style={styles.hintText}
              >
                {t('screen.deckHint')}
              </Typography>
              <View style={styles.chevrons}>
                <Animated.View style={chevron1Style}>
                  <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                </Animated.View>
                <Animated.View style={[chevron2Style, { marginTop: -10 }]}>
                  <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                </Animated.View>
                <Animated.View style={[chevron3Style, { marginTop: -10 }]}>
                  <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                </Animated.View>
              </View>
            </Animated.View>
          </View>
        )}

        <Animated.View entering={homeEntrance(300)}>
          <WeekTimeline
            plays={historyData?.history ?? []}
            isLoading={isHistoryLoading}
            currentUserId={user?.userId ?? ''}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
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
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
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
      overflow: 'hidden',
    },
    carouselStage: {
      width: SCREEN_WIDTH,
      height: CARD_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    carouselNavigationZone: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: SCREEN_WIDTH * 0.16,
      zIndex: 1_001,
    },
    carouselNavigationZoneLeft: {
      left: 0,
    },
    carouselNavigationZoneRight: {
      right: 0,
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
      backgroundColor: colors.pasion,
    },
    homeSkeleton: {
      gap: 0,
    },
    skeletonDeckLabel: {
      width: 108,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.surfaceAlt,
    },
    skeletonShuffle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.surfaceAlt,
    },
    skeletonCarousel: {
      height: CARD_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    skeletonMainCard: {
      zIndex: 2,
      width: SCREEN_WIDTH * 0.56,
      height: CARD_HEIGHT,
      padding: 20,
      borderRadius: 24,
      backgroundColor: colors.surface,
    },
    skeletonSideCard: {
      position: 'absolute',
      width: SCREEN_WIDTH * 0.46,
      height: CARD_HEIGHT * 0.82,
      borderRadius: 22,
      backgroundColor: colors.surface,
      opacity: 0.75,
    },
    skeletonSideCardLeft: {
      left: -SCREEN_WIDTH * 0.24,
      transform: [{ rotate: '-8deg' }],
    },
    skeletonSideCardRight: {
      right: -SCREEN_WIDTH * 0.24,
      transform: [{ rotate: '8deg' }],
    },
    skeletonLine: {
      borderRadius: 6,
      backgroundColor: colors.surfaceAlt,
    },
    skeletonCardLabel: {
      width: '34%',
      height: 10,
      marginBottom: 18,
    },
    skeletonCardTitle: {
      width: '82%',
      height: 18,
      marginBottom: 9,
    },
    skeletonCardTitleShort: {
      width: '58%',
      height: 18,
    },
    skeletonCardSpacer: {
      flex: 1,
    },
    skeletonCardBody: {
      width: '100%',
      height: 12,
      marginBottom: 9,
    },
    skeletonCardBodyShort: {
      width: '66%',
      height: 12,
    },
    skeletonHint: {
      alignItems: 'center',
      marginTop: 24,
    },
    skeletonHintLine: {
      width: 210,
      height: 12,
      marginBottom: 12,
    },
    skeletonChevron: {
      width: 16,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.surfaceAlt,
    },
    skeletonTimeline: {
      marginTop: 44,
      paddingHorizontal: 24,
      gap: 16,
    },
    skeletonTimelineHeading: {
      width: 96,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.surfaceAlt,
    },
    skeletonTimelineDivider: {
      height: 1,
      backgroundColor: colors.border,
    },
    skeletonTimelineRow: {
      height: 72,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
  });
}
