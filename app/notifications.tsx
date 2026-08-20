import {
  View,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useMemo } from 'react';
import { NotificationCard } from '@/components/notifications/notification-card';
import { useNotificationList } from '@/hooks/use-notification-list';
import { useColors } from '@/context/ThemeContext';
import { ThemeColors } from '@/constants/colors';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/components/ui/Typography';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';

const notificationEntrance = (delay: number) =>
  FadeInDown.delay(delay).duration(220).reduceMotion(ReduceMotion.System);

function NotificationSkeletonRow({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.skeletonRow}>
      <View style={styles.skeletonTopRow}>
        <View style={styles.skeletonPill} />
        <View style={styles.skeletonTime} />
      </View>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonMessage} />
      <View style={styles.skeletonUnreadDot} />
    </View>
  );
}

function NotificationsSkeleton({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <ScrollView
      accessibilityLabel="Cargando notificaciones"
      contentContainerStyle={styles.skeletonContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.skeletonMarkAll} />
      <View style={styles.skeletonSectionLabel} />
      <NotificationSkeletonRow styles={styles} />
      <View style={styles.skeletonSectionLabel} />
      <NotificationSkeletonRow styles={styles} />
      <NotificationSkeletonRow styles={styles} />
      <NotificationSkeletonRow styles={styles} />
      <View style={styles.skeletonSectionLabel} />
      <NotificationSkeletonRow styles={styles} />
    </ScrollView>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { groups, isLoading, hasUnread, refresh, markRead, markAllRead } = useNotificationList();
  const { t } = useTranslation('notifications');
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const BUCKET_LABELS: Record<string, string> = {
    today: t('buckets.today'),
    yesterday: t('buckets.yesterday'),
    earlier: t('buckets.earlier'),
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <Animated.View entering={notificationEntrance(0)} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.background} />
        </Pressable>
        <Typography variant="heading" style={styles.headerTitle}>
          {t('title')}
        </Typography>
      </Animated.View>
      {isLoading ? (
        <NotificationsSkeleton styles={styles} />
      ) : groups.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
          <Typography variant="swissTitle" baseFontSize={18} style={styles.emptyTitle}>
            {t('empty')}
          </Typography>
          <Typography
            variant="body"
            baseFontSize={14}
            baseLineHeight={20}
            color={colors.textSecondary}
            style={styles.emptyBody}
          >
            {t('emptyDescription')}
          </Typography>
        </View>
      ) : (
        <SectionList
          ListHeaderComponent={
            hasUnread ? (
              <Animated.View
                entering={notificationEntrance(50)}
                style={{
                  paddingHorizontal: 24,
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                }}
              >
                <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
                  <Typography
                    variant="label"
                    color={colors.pasion}
                    numberOfLines={1}
                    style={styles.markAll}
                  >
                    {t('readAll')}
                  </Typography>
                </TouchableOpacity>
              </Animated.View>
            ) : null
          }
          sections={groups.map((g) => ({ title: g.title, data: g.items }))}
          keyExtractor={(item) => item.id}
          onRefresh={refresh}
          refreshing={isLoading}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section: { title, data } }) => (
            <Animated.View entering={notificationEntrance(90 + data.length * 20)}>
              <Typography variant="cardLabel" color={colors.textMuted} style={styles.sectionHeader}>
                {BUCKET_LABELS[title] ?? title}
              </Typography>
            </Animated.View>
          )}
          renderItem={({ item, index }) => (
            <Animated.View entering={notificationEntrance(120 + index * 55)}>
              <NotificationCard
                item={item}
                onPress={() => {
                  if (!item.read) markRead(item.id);
                  if (item.data?.cardPlayId) {
                    router.push({
                      pathname: '/play-thread',
                      params: { playId: String(item.data.cardPlayId) },
                    });
                  }
                }}
              />
            </Animated.View>
          )}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    backBtn: {
      width: 40,
      backgroundColor: colors.textPrimary,
      height: 40,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 25,
    },
    headerTitle: {
      color: colors.textPrimary,
    },
    markAll: {
      textAlign: 'right',
      flexShrink: 0,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingHorizontal: 40,
    },
    emptyTitle: {
      textAlign: 'center',
    },
    emptyBody: {
      textAlign: 'center',
    },
    listContent: {
      paddingTop: 12,
      paddingBottom: 32,
    },
    skeletonContent: {
      paddingTop: 12,
      paddingBottom: 32,
    },
    skeletonMarkAll: {
      alignSelf: 'flex-end',
      width: 92,
      height: 14,
      marginRight: 24,
      marginBottom: 32,
      borderRadius: 7,
      backgroundColor: colors.surfaceAlt,
    },
    skeletonSectionLabel: {
      width: 56,
      height: 10,
      marginLeft: 24,
      marginBottom: 16,
      borderRadius: 5,
      backgroundColor: colors.surfaceAlt,
    },
    skeletonRow: {
      position: 'relative',
      minHeight: 132,
      marginHorizontal: 24,
      paddingTop: 2,
      paddingBottom: 20,
      marginBottom: 22,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    skeletonTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    skeletonPill: {
      width: 104,
      height: 24,
      borderRadius: 5,
      backgroundColor: colors.surfaceAlt,
    },
    skeletonTime: {
      width: 48,
      height: 11,
      borderRadius: 6,
      backgroundColor: colors.surfaceAlt,
    },
    skeletonTitle: {
      width: '62%',
      height: 16,
      marginBottom: 12,
      borderRadius: 8,
      backgroundColor: colors.surfaceAlt,
    },
    skeletonMessage: {
      width: '38%',
      height: 13,
      borderRadius: 7,
      backgroundColor: colors.surfaceAlt,
    },
    skeletonUnreadDot: {
      position: 'absolute',
      right: 0,
      bottom: 20,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.surfaceAlt,
    },
    sectionHeader: {
      opacity: 1,
      letterSpacing: 2,
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 8,
    },
  });
