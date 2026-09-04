import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  FadeIn,
  FadeOut,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { DeckCard } from '@/lib/api';
import { triggerFeedback } from '@/lib/feedback';
import { useColors } from '@/context/ThemeContext';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';

type Phase = 'sealed' | 'claiming' | 'opening';

const TEAR_DISTANCE = 190;
const TEAR_THRESHOLD = 0.7;

interface WeeklyPackOpeningProps {
  visible: boolean;
  onClaim: () => Promise<boolean>;
  onSkip: () => void;
  onComplete: () => void;
}

interface WeeklyCardRevealProps {
  card: DeckCard;
  index: number;
  total: number;
  reduceMotion?: boolean;
}

/** Reusable one-card reveal, ready for future non-weekly card sources. */
export function WeeklyCardReveal({
  card,
  index,
  total,
  reduceMotion = false,
}: WeeklyCardRevealProps) {
  const { t } = useTranslation('home');
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Animated.View
      entering={FadeIn.duration(reduceMotion ? 0 : 220)}
      exiting={FadeOut.duration(reduceMotion ? 0 : 140)}
      style={styles.cardReveal}
    >
      <Typography variant="cardLabel" color={colors.pasion} style={styles.cardCount}>
        {t('weeklyPack.cardOf', { current: index + 1, total })}
      </Typography>
      <Typography variant="swissTitle" baseFontSize={26} color="#FFFFFF" style={styles.cardTitle}>
        {card.title}
      </Typography>
      <Typography variant="body" color="rgba(255,255,255,.68)" style={styles.cardDescription}>
        {card.description}
      </Typography>
    </Animated.View>
  );
}

export function WeeklyPackOpening({
  visible,
  onClaim,
  onSkip,
  onComplete,
}: WeeklyPackOpeningProps) {
  const { t } = useTranslation('home');
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const progress = useSharedValue(0);
  const openProgress = useSharedValue(0);
  const [phase, setPhase] = useState<Phase>('sealed');
  const [reduceMotion, setReduceMotion] = useState(false);
  const openingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!visible) {
      setPhase('sealed');
      openingRef.current = false;
      progress.value = 0;
      openProgress.value = 0;
    }
  }, [openProgress, progress, visible]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  async function beginOpening() {
    if (openingRef.current) return;
    openingRef.current = true;
    setPhase('claiming');
    const shouldAnimate = await onClaim();
    if (!shouldAnimate) {
      onComplete();
      return;
    }
    triggerFeedback('packCut');
    setPhase('opening');
    progress.value = withTiming(1, { duration: reduceMotion ? 90 : 180 });
    openProgress.value = withTiming(1, { duration: reduceMotion ? 120 : 480 });
    timerRef.current = setTimeout(
      () => {
        onComplete();
      },
      reduceMotion ? 140 : 520
    );
  }

  const tearGesture = Gesture.Pan()
    .enabled(phase === 'sealed')
    .activeOffsetX(8)
    // Android users naturally introduce a little vertical movement while
    // dragging the seal. Keep this a horizontal gesture without rejecting it.
    .failOffsetY([-80, 80])
    .onUpdate((event) => {
      progress.value = Math.max(0, Math.min(1, event.translationX / TEAR_DISTANCE));
    })
    .onEnd(() => {
      if (progress.value >= TEAR_THRESHOLD) {
        progress.value = withTiming(1, { duration: 120 });
        runOnJS(beginOpening)();
      } else {
        progress.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
    });

  const sealStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * TEAR_DISTANCE },
      { rotate: `${interpolate(progress.value, [0, 1], [0, 8])}deg` },
    ],
  }));
  const cutStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));
  const packetBodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(openProgress.value, [0, 1], [0, 26]) },
      { scale: interpolate(openProgress.value, [0, 1], [1, 0.97]) },
    ],
    opacity: interpolate(openProgress.value, [0, 0.8, 1], [1, 0.9, 0]),
  }));
  const tearStripStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(openProgress.value, [0, 1], [0, 70]) },
      { translateY: interpolate(openProgress.value, [0, 1], [0, -24]) },
      { rotate: `${interpolate(openProgress.value, [0, 1], [0, 9])}deg` },
    ],
    opacity: interpolate(openProgress.value, [0, 0.85, 1], [1, 0.8, 0]),
  }));
  const cardStackStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(openProgress.value, [0, 1], [50, -20]) },
      { scale: interpolate(openProgress.value, [0, 1], [0.88, 1]) },
    ],
    opacity: interpolate(openProgress.value, [0, 0.25, 1], [0, 0.35, 1]),
  }));

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={phase === 'sealed' ? onSkip : undefined}
    >
      <View style={styles.root} accessibilityViewIsModal>
        <View style={styles.sealedContent}>
          <View style={styles.copy}>
            <Typography variant="cardLabel" color={colors.pasion} style={styles.eyebrow}>
              {t('weeklyPack.eyebrow')}
            </Typography>
            <Typography
              variant="heading"
              baseFontSize={34}
              baseLineHeight={37}
              color="#FFFFFF"
              style={styles.title}
            >
              {t('weeklyPack.title')}
            </Typography>
            <Typography variant="body" color="rgba(255,255,255,.62)" style={styles.description}>
              {t('weeklyPack.description')}
            </Typography>
          </View>

          <GestureDetector gesture={tearGesture}>
            <Animated.View
              collapsable={false}
              accessible
              accessibilityRole="button"
              accessibilityLabel={t('weeklyPack.gestureHint')}
              accessibilityHint={t('weeklyPack.description')}
              onAccessibilityTap={beginOpening}
              style={styles.packetStage}
            >
              <View pointerEvents="none" style={styles.packetGlow}>
                <Svg width="100%" height="100%" viewBox="0 0 374 454">
                  <Defs>
                    <RadialGradient id="packetBacklight" cx="50%" cy="48%" r="50%">
                      <Stop offset="0%" stopColor={colors.pasion} stopOpacity={0.42} />
                      <Stop offset="38%" stopColor={colors.pasion} stopOpacity={0.24} />
                      <Stop offset="72%" stopColor={colors.pasion} stopOpacity={0.09} />
                      <Stop offset="100%" stopColor={colors.pasion} stopOpacity={0} />
                    </RadialGradient>
                  </Defs>
                  <Ellipse cx="187" cy="227" rx="184" ry="224" fill="url(#packetBacklight)" />
                </Svg>
              </View>

              <Animated.View style={[styles.cardStack, cardStackStyle]} pointerEvents="none">
                <View style={[styles.previewCard, styles.previewCardLeft]} />
                <View style={[styles.previewCard, styles.previewCardRight]} />
                <View style={[styles.previewCard, styles.previewCardCenter]} />
              </Animated.View>

              <Animated.View style={[styles.packet, packetBodyStyle]}>
                <Image
                  source={require('../../assets/images/weekly-pack-minimal.png')}
                  resizeMode="contain"
                  style={styles.packetImage}
                  accessibilityIgnoresInvertColors
                />

                <Animated.View style={[styles.tearStrip, tearStripStyle]} pointerEvents="none">
                  <View style={styles.tearLine} />
                  <Animated.View style={[styles.cutProgress, cutStyle]} />
                  <Animated.View style={[styles.seal, sealStyle]}>
                    <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
                  </Animated.View>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#FFFFFF"
                    style={styles.tearArrow}
                  />
                </Animated.View>
              </Animated.View>
            </Animated.View>
          </GestureDetector>

          <View style={styles.actions}>
            <Button
              label={phase === 'claiming' ? t('weeklyPack.opening') : t('weeklyPack.open')}
              onPress={beginOpening}
              disabled={phase !== 'sealed'}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('weeklyPack.skip')}
              disabled={phase !== 'sealed'}
              onPress={onSkip}
              style={styles.skipButton}
            >
              <Typography variant="button" color="rgba(255,255,255,.42)">
                {t('weeklyPack.skip')}
              </Typography>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#0A0C10',
      paddingHorizontal: 24,
      paddingTop: 66,
      paddingBottom: 22,
      overflow: 'hidden',
    },
    brandMark: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    brandLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: 'rgba(255,255,255,.08)',
    },
    brandText: { letterSpacing: 3 },
    sealedContent: { flex: 1, paddingTop: 24 },
    copy: { alignItems: 'center', paddingHorizontal: 12 },
    eyebrow: { letterSpacing: 3, marginBottom: 10, textAlign: 'center' },
    title: { textAlign: 'center', maxWidth: 320 },
    description: { textAlign: 'center', marginTop: 10, maxWidth: 330, lineHeight: 21 },
    packetStage: {
      width: 250,
      height: 400,
      alignSelf: 'center',
      justifyContent: 'flex-end',
      marginTop: 8,
    },
    packetGlow: {
      position: 'absolute',
      left: -62,
      top: -20,
      width: 374,
      height: 454,
    },
    packet: {
      width: 250,
      height: 400,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.46,
      shadowRadius: 24,
    },
    packetImage: { width: '100%', height: '100%' },
    cardStack: {
      position: 'absolute',
      left: 40,
      right: 40,
      top: 34,
      height: 220,
    },
    previewCard: {
      position: 'absolute',
      left: 28,
      width: 134,
      height: 190,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,.18)',
    },
    previewCardLeft: {
      backgroundColor: colors.rara,
      transform: [{ translateX: -12 }, { rotate: '-10deg' }],
    },
    previewCardRight: {
      backgroundColor: colors.epica,
      transform: [{ translateX: 40 }, { rotate: '10deg' }],
    },
    previewCardCenter: { backgroundColor: colors.comun, transform: [{ translateX: 14 }] },
    tearStrip: {
      position: 'absolute',
      left: 20,
      right: 20,
      top: 27,
      height: 54,
      justifyContent: 'center',
    },
    tearLine: {
      position: 'absolute',
      left: 34,
      right: 15,
      top: 27,
      height: 0,
      borderTopWidth: 1,
      borderStyle: 'dashed',
      borderColor: 'rgba(255,255,255,.8)',
    },
    cutProgress: {
      position: 'absolute',
      left: 34,
      width: TEAR_DISTANCE,
      top: 26,
      height: 2,
      backgroundColor: '#FFFFFF',
      transformOrigin: 'left center',
    },
    seal: {
      position: 'absolute',
      left: 0,
      top: 3,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#0A0C10',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,.92)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.28,
      shadowRadius: 8,
    },
    tearArrow: { position: 'absolute', right: 0, top: 18 },
    actions: { gap: 1, marginTop: 'auto', paddingTop: 8 },
    skipButton: { alignItems: 'center', justifyContent: 'center', minHeight: 42 },
    revealContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    cardReveal: {
      width: '100%',
      minHeight: 330,
      marginTop: 18,
      paddingHorizontal: 30,
      paddingVertical: 42,
      justifyContent: 'center',
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: 'rgba(255,255,255,.08)',
    },
    cardCount: { letterSpacing: 2.2, marginBottom: 24 },
    cardTitle: { marginBottom: 16 },
    cardDescription: { fontSize: 16, lineHeight: 24 },
    revealDots: { flexDirection: 'row', gap: 7, marginTop: 28 },
    revealDot: {
      width: 18,
      height: 3,
      borderRadius: 2,
      backgroundColor: 'rgba(255,255,255,.12)',
    },
    revealDotActive: { backgroundColor: colors.pasion },
  });
}
