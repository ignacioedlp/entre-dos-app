import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Toast } from 'toastify-react-native';
import { AdEventType, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { useAds } from '@/context/AdsContext';
import { useColors } from '@/context/ThemeContext';
import type { ThemeColors } from '@/constants/colors';
import {
  apiClaimExtraCard,
  apiGetExtraCardAttempt,
  DeckCard,
  DeckResponse,
  ExtraCardClaimResponse,
} from '@/lib/api';
import { triggerFeedback } from '@/lib/feedback';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { GameCard } from '@/components/cards/GameCard';
import { WeeklyCardReveal } from './WeeklyPackOpening';

type Phase = 'idle' | 'preparing' | 'loading' | 'confirming';

interface ExtraCardRewardProps {
  extraCard: DeckResponse['extraCard'];
  carousel?: {
    index: number;
    rotation: SharedValue<number>;
    activeIndex: SharedValue<number>;
    isActive: boolean;
    onFocus: () => void;
  };
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.56;
const CARD_HEIGHT = CARD_WIDTH * (4 / 3);
const SIDE_SCALE = 0.82;
const SIDE_ROTATION = 8;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function showRewardedAd(claim: Extract<ExtraCardClaimResponse, { status: 'ad_required' }>) {
  return new Promise<void>((resolve, reject) => {
    const ad = RewardedAd.createForAdRequest(claim.adUnitId, {
      // Entre Dos does not request ATT or use the IDFA. Keep every rewarded
      // ad request non-personalized, irrespective of the UMP regional choice.
      requestNonPersonalizedAdsOnly: true,
      serverSideVerificationOptions: {
        userId: claim.userId,
        customData: claim.customData,
      },
    });
    let earned = false;
    let settled = false;
    let loadTimeout: ReturnType<typeof setTimeout>;
    const subscriptions: (() => void)[] = [];
    const cleanup = () => {
      clearTimeout(loadTimeout);
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    subscriptions.push(
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        void ad.show().catch(fail);
      }),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
        settled = true;
        cleanup();
        resolve();
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        if (!earned && !settled) {
          fail(new Error('rewarded-ad-closed'));
        }
      }),
      ad.addAdEventListener(AdEventType.ERROR, (error) => {
        if (!settled) {
          fail(error);
        }
      })
    );
    loadTimeout = setTimeout(() => fail(new Error('rewarded-ad-load-timeout')), 20_000);
    ad.load();
  });
}

export function ExtraCardReward({ extraCard, carousel }: ExtraCardRewardProps) {
  const { t } = useTranslation('home');
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const { ensureReady } = useAds();
  const [phase, setPhase] = useState<Phase>('idle');
  const [revealedCard, setRevealedCard] = useState<DeckCard | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted.current = false;
      subscription.remove();
    };
  }, []);

  function applyGrantedCard(card: DeckCard) {
    queryClient.setQueryData<DeckResponse>(['deck'], (current) =>
      current
        ? {
            ...current,
            cards: current.cards.some((item) => item.id === card.id)
              ? current.cards
              : [...current.cards, card],
            extraCard: { ...current.extraCard, state: 'claimed', requiresAd: false },
          }
        : current
    );
    triggerFeedback('success');
    setRevealedCard(card);
    void queryClient.invalidateQueries({ queryKey: ['deck'] });
  }

  async function pollAttempt(attemptId: string) {
    setPhase('confirming');
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      try {
        const result = await apiGetExtraCardAttempt(attemptId);
        if (result.status === 'granted') return result.card;
        if (result.status === 'expired') throw new Error('rewarded-attempt-expired');
      } catch (error) {
        if (error instanceof Error && error.message === 'rewarded-attempt-expired') throw error;
        // A transient polling error must not discard a reward awaiting SSV.
      }
      await delay(Math.min(2000, Math.max(deadline - Date.now(), 0)));
    }
    return null;
  }

  async function claim() {
    if (phase !== 'idle') return;
    setPhase('preparing');
    try {
      const result = await apiClaimExtraCard(Platform.OS === 'android' ? 'android' : 'ios');
      if (result.status === 'granted') {
        applyGrantedCard(result.card);
        return;
      }

      const ready = await ensureReady();
      if (!ready) throw new Error('ads-consent-unavailable');
      setPhase('loading');
      await showRewardedAd(result);
      const card = await pollAttempt(result.attemptId);
      if (card) {
        applyGrantedCard(card);
      } else {
        Toast.info(t('extraCard.confirmingDelayed'));
        void queryClient.invalidateQueries({ queryKey: ['deck'] });
      }
    } catch (error) {
      const closed = error instanceof Error && error.message === 'rewarded-ad-closed';
      Toast.warn(t(closed ? 'extraCard.closed' : 'extraCard.unavailable'));
    } finally {
      if (mounted.current) setPhase('idle');
    }
  }

  const loadingLabel =
    phase === 'confirming'
      ? t('extraCard.confirming')
      : phase === 'loading'
        ? t('extraCard.loading')
        : phase === 'preparing'
          ? t('extraCard.preparing')
          : extraCard.requiresAd
            ? t('extraCard.ctaAd')
            : t('extraCard.ctaPremium');

  const carouselStyle = useAnimatedStyle(() => {
    if (!carousel) return {};
    const position = carousel.index - carousel.rotation.value;
    const distance = Math.abs(position);
    const visible = distance < 1.5;
    const scale = interpolate(distance, [0, 1, 1.5], [1, SIDE_SCALE, 0.7], Extrapolation.CLAMP);
    const opacity = interpolate(distance, [0, 1, 1.5], [1, 0.9, 0], Extrapolation.CLAMP);
    return {
      transform: [
        { translateX: position * CARD_WIDTH },
        { rotateZ: `${position * SIDE_ROTATION}deg` },
        { scale },
      ],
      opacity: visible ? opacity : 0,
      zIndex: Math.round((2 - distance) * 100),
      shadowColor: colors.glowPasion,
      shadowOpacity: interpolate(distance, [0, 1], [0.5, 0.2], Extrapolation.CLAMP),
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
      pointerEvents: visible ? 'auto' : 'none',
    };
  });

  if (extraCard.state !== 'available') return null;

  const deckCard = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('extraCard.title')}. ${loadingLabel}`}
      disabled={phase !== 'idle'}
      onPress={carousel && !carousel.isActive ? carousel.onFocus : claim}
      style={({ pressed }) => [
        styles.deckCard,
        pressed && styles.deckCardPressed,
        phase !== 'idle' && styles.disabled,
      ]}
      testID="extra-card-reward"
    >
      <GameCard
        card={{
          rarity: 'pasion',
          label: t('extraCard.deckLabel'),
          title: t('extraCard.deckTitle'),
          description:
            phase === 'idle'
              ? t(extraCard.requiresAd ? 'extraCard.deckBodyAd' : 'extraCard.deckBodyPremium')
              : loadingLabel,
          specialWatermark: 'sparkles',
        }}
        width={CARD_WIDTH}
      />
    </Pressable>
  );

  const rewardContent = carousel ? (
    <Animated.View style={[styles.cardSlot, carouselStyle]}>{deckCard}</Animated.View>
  ) : (
    <View style={styles.standaloneCard}>{deckCard}</View>
  );

  return (
    <>
      {rewardContent}

      <Modal
        visible={Boolean(revealedCard)}
        animationType={reduceMotion ? 'none' : 'fade'}
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setRevealedCard(null)}
      >
        <View style={styles.reveal} accessibilityViewIsModal>
          <Typography variant="cardLabel" color={colors.pasion} style={styles.eyebrow}>
            {t('extraCard.revealed')}
          </Typography>
          {revealedCard ? (
            <WeeklyCardReveal card={revealedCard} index={0} total={1} reduceMotion={reduceMotion} />
          ) : null}
          <Button
            label={t('extraCard.done')}
            onPress={() => setRevealedCard(null)}
            style={styles.done}
          />
        </View>
      </Modal>
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    disabled: { opacity: 0.5 },
    standaloneCard: {
      alignSelf: 'center',
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      marginTop: 16,
      marginBottom: 20,
    },
    cardSlot: {
      position: 'absolute',
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    },
    deckCard: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    },
    deckCardPressed: { transform: [{ scale: 0.985 }] },
    reveal: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      backgroundColor: '#0A0C10',
    },
    eyebrow: { textAlign: 'center', letterSpacing: 3, marginBottom: 20 },
    done: { marginTop: 36 },
  });
}
