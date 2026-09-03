import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';

import { PackCard } from '../../components/cards/PackCard';
import { useColors } from '../../context/ThemeContext';
import { apiGetPacks, apiGetEntitlements, Pack } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { useRevenueCat } from '../../context/RevenueCatContext';
import { Typography } from '@/components/ui/Typography';
import { router } from 'expo-router';

const CARD_PADDING = 24;
const packEntrance = (delay: number) =>
  FadeInDown.delay(delay).duration(260).reduceMotion(ReduceMotion.System);

function PackSkeleton({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View accessibilityLabel="Cargando packs" style={styles.skeletonContent}>
      <View style={styles.skeletonRow}>
        <View style={[styles.skeletonCard, styles.skeletonHalfCard]}>
          <View style={[styles.skeletonLine, styles.skeletonLabel]} />
          <View style={[styles.skeletonLine, styles.skeletonTitle]} />
          <View style={[styles.skeletonLine, styles.skeletonSubtitle]} />
          <View style={styles.skeletonSpacer} />
          <View style={[styles.skeletonLine, styles.skeletonBodyLine]} />
          <View style={[styles.skeletonLine, styles.skeletonBodyLineShort]} />
        </View>
        <View style={[styles.skeletonCard, styles.skeletonHalfCard]}>
          <View style={[styles.skeletonLine, styles.skeletonLabel]} />
          <View style={[styles.skeletonLine, styles.skeletonTitle]} />
          <View style={[styles.skeletonLine, styles.skeletonSubtitle]} />
          <View style={styles.skeletonSpacer} />
          <View style={[styles.skeletonLine, styles.skeletonBodyLine]} />
          <View style={[styles.skeletonLine, styles.skeletonBodyLineShort]} />
          <View style={styles.skeletonButton} />
        </View>
      </View>
      <View style={[styles.skeletonCard, styles.skeletonFullCard]}>
        <View style={[styles.skeletonLine, styles.skeletonLabel]} />
        <View style={[styles.skeletonLine, styles.skeletonWideTitle]} />
        <View style={[styles.skeletonLine, styles.skeletonWideSubtitle]} />
        <View style={styles.skeletonSpacer} />
        <View style={[styles.skeletonLine, styles.skeletonWideBodyLine]} />
        <View style={[styles.skeletonLine, styles.skeletonWideBodyLineShort]} />
        <View style={styles.skeletonButton} />
      </View>
    </View>
  );
}

export default function PacksScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('home');
  const { isSubscribed } = useRevenueCat();
  const colors = useColors();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['packs'],
    queryFn: apiGetPacks,
  });

  const { data: entitlements } = useQuery({
    queryKey: ['entitlements'],
    queryFn: apiGetEntitlements,
  });

  const isPremium = isSubscribed || entitlements?.premium === true;

  const packs = data?.packs.sort((a, b) => Number(b.isBase) - Number(a.isBase)) ?? [];
  const customCardsPack: Pack = {
    id: 'custom-cards',
    slug: 'custom-cards',
    isBase: false,
    priceUsd: 0,
    color: 'passion',
    name: t('packs.customCards'),
    subtitle: t('packs.customCardsSubtitle'),
    description: t('packs.customCardsDescription'),
    owned: true,
  };

  const styles = createStyles(colors);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <Animated.View entering={packEntrance(0)} style={styles.header}>
        <Typography variant="heading" style={styles.title}>
          {t('packs.title')}
        </Typography>
        <Typography
          variant="body"
          baseFontSize={15}
          baseLineHeight={22}
          color={colors.textSecondary}
        >
          {t('packs.subtitle')}
        </Typography>
        {isPremium && (
          <View style={styles.premiumActions}>
            <Typography variant="label" color={colors.accent} style={styles.subscribedBadge}>
              {t('packs.subscribed')}
            </Typography>
          </View>
        )}
      </Animated.View>

      {isLoading ? (
        <PackSkeleton styles={styles} />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.accent}
            />
          }
        >
          {packs.length >= 2 && (
            <Animated.View entering={packEntrance(80)} style={styles.row}>
              <PackCard pack={packs[0]} half isPremium={isPremium} />
              <PackCard pack={packs[1]} half isPremium={isPremium} />
            </Animated.View>
          )}
          {packs.length === 1 && (
            <Animated.View entering={packEntrance(80)}>
              <PackCard pack={packs[0]} isPremium={isPremium} />
            </Animated.View>
          )}
          {packs.slice(2).map((pack, index) => (
            <Animated.View entering={packEntrance(160 + index * 80)} key={pack.id}>
              <PackCard pack={pack} isPremium={isPremium} />
            </Animated.View>
          ))}
          {isPremium && (
            <Animated.View entering={packEntrance(160 + packs.length * 80)}>
              <PackCard
                isPremium
                onPress={() => router.push('/custom-cards')}
                pack={customCardsPack}
              />
            </Animated.View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: CARD_PADDING,
      marginBottom: 24,
    },
    title: {
      marginBottom: 8,
    },
    subscribedBadge: {
      letterSpacing: 1,
    },
    premiumActions: { marginTop: 12 },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: CARD_PADDING,
      paddingBottom: 32,
      gap: 12,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    skeletonContent: {
      paddingHorizontal: CARD_PADDING,
      gap: 12,
    },
    skeletonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    skeletonCard: {
      minHeight: 220,
      padding: 18,
      borderRadius: 20,
      backgroundColor: colors.surface,
    },
    skeletonHalfCard: {
      flex: 1,
    },
    skeletonFullCard: {
      minHeight: 250,
    },
    skeletonLine: {
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.surfaceAlt,
    },
    skeletonLabel: {
      width: '42%',
      marginBottom: 14,
    },
    skeletonTitle: {
      width: '78%',
      height: 18,
      marginBottom: 8,
    },
    skeletonSubtitle: {
      width: '58%',
    },
    skeletonWideTitle: {
      width: '38%',
      height: 18,
      marginBottom: 8,
    },
    skeletonWideSubtitle: {
      width: '48%',
    },
    skeletonSpacer: {
      flex: 1,
      minHeight: 34,
    },
    skeletonBodyLine: {
      width: '100%',
      marginBottom: 8,
    },
    skeletonBodyLineShort: {
      width: '72%',
    },
    skeletonWideBodyLine: {
      width: '68%',
      marginBottom: 8,
    },
    skeletonWideBodyLineShort: {
      width: '42%',
      marginBottom: 18,
    },
    skeletonButton: {
      height: 42,
      marginTop: 18,
      borderRadius: 21,
      backgroundColor: colors.surfaceAlt,
    },
  });
