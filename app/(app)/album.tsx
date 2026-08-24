import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Image, Pressable, SectionList, StyleSheet, View } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { GameCard } from '@/components/cards/GameCard';
import { Typography } from '@/components/ui/Typography';
import { darkColors, RarityKey, ThemeColors } from '@/constants/colors';
import { useColors } from '@/context/ThemeContext';
import { AlbumMoment, apiGetAlbumMoments, apiGetEntitlements } from '@/lib/api';

type AlbumSection = { title: string; data: AlbumMoment[] };

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

  const entitlementQuery = useQuery({
    queryKey: ['entitlements'],
    queryFn: apiGetEntitlements,
  });
  const premium = entitlementQuery.data?.premium === true;
  const momentsQuery = useInfiniteQuery({
    queryKey: ['album-moments'],
    queryFn: ({ pageParam }) => apiGetAlbumMoments(pageParam),
    initialPageParam: null as string | null,
    enabled: premium,
    getNextPageParam: (page) => page.nextCursor,
  });

  const sections = useMemo<AlbumSection[]>(() => {
    const grouped = new Map<string, AlbumMoment[]>();
    for (const moment of momentsQuery.data?.pages.flatMap((page) => page.moments) ?? []) {
      const label = monthLabel(moment.playedAt, i18n.language);
      grouped.set(label, [...(grouped.get(label) ?? []), moment]);
    }
    return [...grouped.entries()].map(([title, data]) => ({ title, data }));
  }, [i18n.language, momentsQuery.data?.pages]);

  if (entitlementQuery.isSuccess && !premium) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="images-outline" size={56} color={colors.pasion} />
        <Typography variant="heading" style={styles.lockedTitle}>
          {t('album.lockedTitle')}
        </Typography>
        <Typography variant="body" color={colors.textSecondary} style={styles.lockedCopy}>
          {t('album.lockedCopy')}
        </Typography>
        <Pressable onPress={() => router.push('/paywall')} style={styles.primaryButton}>
          <Typography variant="label" color="#FFFFFF">
            {t('album.unlock')}
          </Typography>
        </Pressable>
      </View>
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
          entitlementQuery.isLoading || momentsQuery.isLoading ? null : (
            <View style={styles.empty}>
              <Ionicons name="images-outline" size={46} color={colors.textMuted} />
              <Typography variant="bodyBold">{t('album.emptyTitle')}</Typography>
              <Typography variant="body" color={colors.textSecondary} style={styles.emptyCopy}>
                {t('album.emptyCopy')}
              </Typography>
            </View>
          )
        }
        ListFooterComponent={
          momentsQuery.isFetchingNextPage ? (
            <Typography variant="caption" color={colors.textMuted} style={styles.loadingMore}>
              {t('album.loadingMore')}
            </Typography>
          ) : null
        }
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    centered: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 16 },
    header: { paddingHorizontal: 24, paddingBottom: 20, gap: 8 },
    content: { paddingHorizontal: 24, paddingBottom: 32 },
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
    primaryButton: {
      backgroundColor: colors.pasion,
      borderRadius: 999,
      paddingHorizontal: 22,
      paddingVertical: 14,
    },
  });
}
