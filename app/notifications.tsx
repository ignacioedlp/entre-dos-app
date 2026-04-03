import {
  View,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { NotificationCard } from '@/components/notifications/notification-card';
import { useNotificationList } from '@/hooks/use-notification-list';
import { Colors } from '@/constants/colors';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/components/ui/Typography';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { groups, isLoading, hasUnread, refresh, markRead, markAllRead } = useNotificationList();
  const { t } = useTranslation('notifications');

  const BUCKET_LABELS: Record<string, string> = {
    today: t('buckets.today'),
    yesterday: t('buckets.yesterday'),
    earlier: t('buckets.earlier'),
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.background} />
        </Pressable>
        <Typography variant="heading" style={styles.headerTitle}>
          {t('title')}
        </Typography>
      </View>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="notifications-off-outline" size={48} color={Colors.textMuted} />
          <Typography variant="swissTitle" baseFontSize={18} style={styles.emptyTitle}>
            {t('empty')}
          </Typography>
          <Typography variant="body" baseFontSize={14} baseLineHeight={20} color={Colors.textSecondary} style={styles.emptyBody}>
            {t('emptyDescription')}
          </Typography>
        </View>
      ) : (
        <SectionList
          ListHeaderComponent={
            hasUnread ? (
              <View
                style={{
                  paddingHorizontal: 24,
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                }}
              >
                <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
                  <Typography variant="label" color={Colors.pasion} style={styles.markAll}>
                    {t('readAll')}
                  </Typography>
                </TouchableOpacity>
              </View>
            ) : null
          }
          sections={groups.map((g) => ({ title: g.title, data: g.items }))}
          keyExtractor={(item) => item.id}
          onRefresh={refresh}
          refreshing={isLoading}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section: { title } }) => (
            <Typography variant="cardLabel" color={Colors.textMuted} style={styles.sectionHeader}>
              {BUCKET_LABELS[title] ?? title}
            </Typography>
          )}
          renderItem={({ item }) => (
            <NotificationCard
              item={item}
              onPress={() => {
                if (!item.read) markRead(item.id);
              }}
            />
          )}
          stickySectionHeadersEnabled={false}
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    backgroundColor: Colors.textPrimary,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },
  headerTitle: {
    color: Colors.textPrimary,
  },
  markAll: {
    textAlign: 'right',
    width: 60,
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
  sectionHeader: {
    opacity: 1,
    letterSpacing: 2,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
});
