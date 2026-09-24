import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Toast } from 'toastify-react-native';

import { GameCard } from '@/components/cards/GameCard';
import { Typography } from '@/components/ui/Typography';
import { darkColors, RarityKey, ThemeColors } from '@/constants/colors';
import { useAds } from '@/context/AdsContext';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { useColors } from '@/context/ThemeContext';
import {
  AlbumAccessResponse,
  AlbumMoment,
  apiClaimAlbumAccess,
  apiGetAlbumAccess,
  apiGetAlbumAccessAttempt,
  apiGetAlbumMoments,
} from '@/lib/api';
import { rewardedAdErrorDiagnostics, showRewardedAd } from '@/lib/rewarded-ads';
import { trackError, trackEvent } from '@/lib/analytics';

type AlbumSection = { title: string; data: AlbumMoment[] };
type RewardPhase = 'idle' | 'preparing' | 'loading' | 'confirming';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const nativePlatform = Platform.OS === 'android' ? 'android' : 'ios';

const RARITY_MAP: Record<AlbumMoment['card']['rarity'], RarityKey> = {
  common: 'comun',
  rare: 'rara',
  epic: 'epica',
  legendary: 'legendaria',
};

function monthLabel(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(date));
}

function CardThumbnail({ card }: Pick<AlbumMoment, 'card'>) {
  const rarity = RARITY_MAP[card.rarity];

  return (
    <View style={thumbnailStyles.container}>
      <GameCard
        card={{
          rarity,
          category: card.category,
          label: '',
          title: '',
        }}
        variant="thumbnail"
        width={60}
      />
    </View>
  );
}

function AlbumSkeleton({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <ScrollView
      accessibilityLabel="Cargando álbum"
      contentContainerStyle={styles.skeletonContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.skeletonMonth} />
      <AlbumSkeletonRow styles={styles} titleWidth="58%" />
      <AlbumSkeletonRow styles={styles} titleWidth="72%" />
      <AlbumSkeletonRow styles={styles} titleWidth="48%" />
      <AlbumSkeletonRow styles={styles} titleWidth="64%" />
      <AlbumSkeletonRow styles={styles} titleWidth="54%" />
    </ScrollView>
  );
}

function AlbumSkeletonRow({
  styles,
  titleWidth,
}: {
  styles: ReturnType<typeof createStyles>;
  titleWidth: `${number}%`;
}) {
  return (
    <View style={styles.skeletonMoment}>
      <View style={styles.skeletonThumbnail} />
      <View style={styles.skeletonMomentBody}>
        <View style={[styles.skeletonLine, styles.skeletonTitle, { width: titleWidth }]} />
        <View style={[styles.skeletonLine, styles.skeletonDate]} />
        <View style={styles.skeletonActivity}>
          <View style={styles.skeletonIcon} />
          <View style={[styles.skeletonLine, styles.skeletonCount]} />
          <View style={styles.skeletonIcon} />
          <View style={[styles.skeletonLine, styles.skeletonCount]} />
        </View>
      </View>
      <View style={styles.skeletonChevron} />
    </View>
  );
}

const thumbnailStyles = StyleSheet.create({
  container: {
    width: 76,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function AlbumScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation('home');
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const { ensureReady } = useAds();
  const { presentPaywallIfNeeded } = useRevenueCat();
  const [rewardPhase, setRewardPhase] = useState<RewardPhase>('idle');
  const mounted = useRef(true);

  const accessQuery = useQuery({
    queryKey: ['album-access', nativePlatform],
    queryFn: () => apiGetAlbumAccess(nativePlatform),
  });
  const refetchAccess = accessQuery.refetch;
  const hasAccess = accessQuery.data?.access !== 'locked' && accessQuery.data !== undefined;
  const momentsQuery = useInfiniteQuery({
    queryKey: ['album-moments'],
    queryFn: ({ pageParam }) => apiGetAlbumMoments(pageParam),
    initialPageParam: null as string | null,
    enabled: hasAccess,
    getNextPageParam: (page) => page.nextCursor,
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refetchAccess();
    }, [refetchAccess])
  );

  async function pollAttempt(attemptId: string) {
    setRewardPhase('confirming');
    const deadline = Date.now() + 30_000;
    let pollDelay = 400;
    while (Date.now() < deadline) {
      try {
        const result = await apiGetAlbumAccessAttempt(attemptId);
        if (result.status === 'granted') return result.expiresAt;
        if (result.status === 'expired') throw new Error('rewarded-attempt-expired');
      } catch (error) {
        if (error instanceof Error && error.message === 'rewarded-attempt-expired') throw error;
      }
      await delay(Math.min(pollDelay, Math.max(deadline - Date.now(), 0)));
      pollDelay = Math.min(pollDelay * 2, 2000);
    }
    return null;
  }

  async function watchAd() {
    if (rewardPhase !== 'idle') return;
    setRewardPhase('preparing');
    trackEvent('album_access_claim_started');
    let stage: 'claim' | 'initialization' | 'load' | 'verification' = 'claim';
    try {
      const result = await apiClaimAlbumAccess(nativePlatform);
      if (result.status === 'granted') {
        queryClient.setQueryData(['album-access', nativePlatform], result);
      } else {
        stage = 'initialization';
        const ready = await ensureReady();
        if (!ready) throw new Error('ads-consent-unavailable');
        setRewardPhase('loading');
        stage = 'load';
        await showRewardedAd(result);
        stage = 'verification';
        const expiresAt = await pollAttempt(result.attemptId);
        if (expiresAt) {
          const access: AlbumAccessResponse = {
            access: 'rewarded',
            expiresAt,
            rewardedAdAvailable: false,
            rewardedAccessMinutes: accessQuery.data?.rewardedAccessMinutes ?? 30,
          };
          queryClient.setQueryData(['album-access', nativePlatform], access);
        } else {
          Toast.info(t('album.adConfirmingDelayed'));
          await refetchAccess();
        }
      }
      void queryClient.invalidateQueries({ queryKey: ['album-moments'] });
    } catch (error) {
      const diagnostics = rewardedAdErrorDiagnostics(error);
      trackError(error, {
        area: 'ads',
        flow: 'album-access',
        stage,
        platform: Platform.OS,
        ...diagnostics,
      });
      const closed = error instanceof Error && error.message === 'rewarded-ad-closed';
      Toast.warn(t(closed ? 'album.adClosed' : 'album.adUnavailable'));
    } finally {
      if (mounted.current) setRewardPhase('idle');
    }
  }

  async function subscribe() {
    trackEvent('subscription_cta_tapped', { source: 'album' });
    try {
      await presentPaywallIfNeeded();
      await refetchAccess();
    } catch (error) {
      trackError(error, { area: 'subscriptions', flow: 'albumSubscribeTap' });
      Toast.error(t('paywall.error'));
    }
  }

  const rewardLabel =
    rewardPhase === 'preparing'
      ? t('album.adPreparing')
      : rewardPhase === 'loading'
        ? t('album.adLoading')
        : rewardPhase === 'confirming'
          ? t('album.adConfirming')
          : t('album.watchAd');

  const sections = useMemo<AlbumSection[]>(() => {
    const grouped = new Map<string, AlbumMoment[]>();
    for (const moment of momentsQuery.data?.pages.flatMap((page) => page.moments) ?? []) {
      const label = monthLabel(moment.playedAt, i18n.language);
      grouped.set(label, [...(grouped.get(label) ?? []), moment]);
    }
    return [...grouped.entries()].map(([title, data]) => ({ title, data }));
  }, [i18n.language, momentsQuery.data?.pages]);

  if (accessQuery.isError) {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.centered,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Ionicons name="cloud-offline-outline" size={52} color={colors.textMuted} />
        <Typography variant="heading" style={styles.lockedTitle}>
          {t('album.accessErrorTitle')}
        </Typography>
        <Typography variant="body" color={colors.textSecondary} style={styles.lockedCopy}>
          {t('album.accessErrorCopy')}
        </Typography>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('album.retry')}
          onPress={() => void refetchAccess()}
          style={({ pressed }) => [
            styles.secondaryButton,
            styles.retryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Typography variant="label" color={colors.textPrimary}>
            {t('album.retry')}
          </Typography>
        </Pressable>
      </ScrollView>
    );
  }

  if (accessQuery.isSuccess && accessQuery.data.access === 'locked') {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.centered,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Ionicons name="images-outline" size={56} color={colors.pasion} />
        <Typography variant="heading" style={styles.lockedTitle}>
          {t('album.lockedTitle')}
        </Typography>
        <Typography variant="body" color={colors.textSecondary} style={styles.lockedCopy}>
          {t('album.lockedCopy', { minutes: accessQuery.data.rewardedAccessMinutes })}
        </Typography>
        <View style={styles.lockedActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('album.subscribe')}
            onPress={() => void subscribe()}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            testID="album-subscribe"
          >
            <Typography variant="label" color="#FFFFFF">
              {t('album.subscribe')}
            </Typography>
          </Pressable>
          {accessQuery.data.rewardedAdAvailable ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('album.watchAd')}. ${t('album.adAccessDuration', { minutes: accessQuery.data.rewardedAccessMinutes })}`}
              disabled={rewardPhase !== 'idle'}
              onPress={watchAd}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
                rewardPhase !== 'idle' && styles.buttonDisabled,
              ]}
              testID="album-watch-ad"
            >
              <Typography variant="label" color={colors.textPrimary}>
                {rewardLabel}
              </Typography>
            </Pressable>
          ) : null}
        </View>
        {accessQuery.data.rewardedAdAvailable ? (
          <Typography variant="caption" color={colors.textMuted} style={styles.adDuration}>
            {t('album.adAccessDuration', { minutes: accessQuery.data.rewardedAccessMinutes })}
          </Typography>
        ) : null}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Typography variant="heading">{t('album.title')}</Typography>
        <Typography variant="body" color={colors.textSecondary}>
          {t('album.subtitle')}
        </Typography>
      </View>
      {accessQuery.isLoading || momentsQuery.isLoading ? (
        <AlbumSkeleton styles={styles} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(moment) => moment.id}
          contentContainerStyle={styles.content}
          stickySectionHeadersEnabled={false}
          onEndReached={() => {
            if (momentsQuery.hasNextPage && !momentsQuery.isFetchingNextPage) {
              momentsQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          renderSectionHeader={({ section }) => (
            <Typography variant="label" color={colors.pasion} style={styles.month}>
              {section.title}
            </Typography>
          )}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/play-thread', params: { playId: item.id } })}
              style={({ pressed }) => [styles.moment, pressed && styles.momentPressed]}
            >
              {item.photo?.url ? (
                <Image source={{ uri: item.photo.url }} style={styles.photo} />
              ) : (
                <CardThumbnail card={item.card} />
              )}
              <View style={styles.momentBody}>
                <Typography variant="bodyBold" numberOfLines={2}>
                  {item.card.title}
                </Typography>
                <Typography variant="caption" color={colors.textSecondary} numberOfLines={1}>
                  {new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
                    new Date(item.playedAt)
                  )}
                </Typography>
                <View style={styles.activity}>
                  <Ionicons name="chatbubble-outline" size={14} color={colors.textMuted} />
                  <Typography variant="caption" color={colors.textMuted}>
                    {item.commentCount}
                  </Typography>
                  <Ionicons name="heart-outline" size={14} color={colors.textMuted} />
                  <Typography variant="caption" color={colors.textMuted}>
                    {item.reactionCount}
                  </Typography>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="images-outline" size={46} color={colors.textMuted} />
              <Typography variant="bodyBold">{t('album.emptyTitle')}</Typography>
              <Typography variant="body" color={colors.textSecondary} style={styles.emptyCopy}>
                {t('album.emptyCopy')}
              </Typography>
            </View>
          }
          ListFooterComponent={
            momentsQuery.isFetchingNextPage ? (
              <Typography variant="caption" color={colors.textMuted} style={styles.loadingMore}>
                {t('album.loadingMore')}
              </Typography>
            ) : null
          }
        />
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    centered: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 36,
      gap: 16,
    },
    header: { paddingHorizontal: 24, paddingBottom: 20, gap: 8 },
    content: { paddingHorizontal: 24, paddingBottom: 32 },
    skeletonContent: { paddingHorizontal: 24, paddingBottom: 32 },
    skeletonMonth: {
      width: 144,
      height: 14,
      marginTop: 14,
      marginBottom: 18,
      borderRadius: 7,
      backgroundColor: colors.surfaceAlt,
    },
    skeletonMoment: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 96,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor:
        colors.background === darkColors.background ? 'rgba(255, 255, 255, 0.16)' : colors.border,
    },
    skeletonThumbnail: {
      width: 76,
      height: 76,
      borderRadius: 11,
      backgroundColor: colors.surfaceAlt,
    },
    skeletonMomentBody: { flex: 1, gap: 9 },
    skeletonLine: { borderRadius: 6, backgroundColor: colors.surfaceAlt },
    skeletonTitle: { height: 17 },
    skeletonDate: { width: '44%', height: 12 },
    skeletonActivity: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    skeletonIcon: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.surfaceAlt,
    },
    skeletonCount: { width: 10, height: 11, marginRight: 5 },
    skeletonChevron: {
      width: 10,
      height: 10,
      borderTopWidth: 2,
      borderRightWidth: 2,
      borderColor: colors.surfaceAlt,
      transform: [{ rotate: '45deg' }],
      marginRight: 4,
    },
    month: { textTransform: 'uppercase', marginTop: 14, marginBottom: 10, letterSpacing: 1 },
    moment: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 96,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor:
        colors.background === darkColors.background ? 'rgba(255, 255, 255, 0.16)' : colors.border,
    },
    momentPressed: { opacity: 0.75 },
    photo: { width: 76, height: 76, borderRadius: 11, backgroundColor: colors.border },
    momentBody: { flex: 1, gap: 4 },
    activity: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 36, gap: 12 },
    emptyCopy: { textAlign: 'center' },
    loadingMore: { paddingVertical: 20, textAlign: 'center' },
    lockedTitle: { textAlign: 'center' },
    lockedCopy: { textAlign: 'center' },
    lockedActions: { width: '100%', maxWidth: 320, gap: 12, marginTop: 4 },
    primaryButton: {
      backgroundColor: colors.pasion,
      borderRadius: 999,
      paddingVertical: 14,
      alignItems: 'center',
      shadowColor: colors.glowPasion,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 18,
      elevation: 8,
    },
    secondaryButton: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.textMuted,
      paddingVertical: 14,
      alignItems: 'center',
    },
    retryButton: { width: '100%', maxWidth: 320, marginTop: 4 },
    buttonPressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
    buttonDisabled: { opacity: 0.45 },
    adDuration: { textAlign: 'center', marginTop: -4 },
  });
}
