import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { PackCard } from '../../components/cards/PackCard';
import { Colors } from '../../constants/colors';
import { apiGetPacks, apiGetEntitlements } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { useRevenueCat } from '../../context/RevenueCatContext';
import { Typography } from '@/components/ui/Typography';

const CARD_PADDING = 24;

export default function PacksScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('home');
  const { isSubscribed } = useRevenueCat();

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

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Typography variant="heading" style={styles.title}>
          {t('packs.title')}
        </Typography>
        <Typography variant="body" baseFontSize={15} baseLineHeight={22} color={Colors.textSecondary}>
          {t('packs.subtitle')}
        </Typography>
        {isPremium && (
          <Typography variant="label" color={Colors.accent} style={styles.subscribedBadge}>
            {t('packs.subscribed')}
          </Typography>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.accent}
            />
          }
        >
          {packs.length >= 2 && (
            <View style={styles.row}>
              <PackCard pack={packs[0]} half isPremium={isPremium} />
              <PackCard pack={packs[1]} half isPremium={isPremium} />
            </View>
          )}
          {packs.length === 1 && <PackCard pack={packs[0]} isPremium={isPremium} />}
          {packs.slice(2).map((pack) => (
            <PackCard key={pack.id} pack={pack} isPremium={isPremium} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
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
    marginTop: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
});
