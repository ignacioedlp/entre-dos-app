import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { NotificationCard } from "@/components/notifications/notification-card";
import { useNotificationList } from "@/hooks/use-notification-list";
import { Colors } from "@/constants/colors";
import { useTranslation } from "react-i18next";

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { groups, isLoading, hasUnread, refresh, markRead, markAllRead } =
    useNotificationList();
  const { t } = useTranslation("notifications");

  const BUCKET_LABELS: Record<string, string> = {
    today: t("buckets.today"),
    yesterday: t("buckets.yesterday"),
    earlier: t("buckets.earlier"),
  };

  return (
    // <View style={[styles.root, { paddingTop: insets.top }]}>
    //   <View style={styles.header}>
    //     <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
    //       <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
    //     </TouchableOpacity>
    //     <Text style={styles.headerTitle}>NOTIFICACIONES</Text>
    //     {hasUnread ? (
    //       <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
    //         <Text style={styles.markAll}>Leer todo</Text>
    //       </TouchableOpacity>
    //     ) : (
    //       <View style={styles.backBtn} />
    //     )}
    //   </View>
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.background} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("title")}</Text>
      </View>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons
            name="notifications-off-outline"
            size={48}
            color={Colors.textMuted}
          />
          <Text style={styles.emptyTitle}>{t("empty")}</Text>
          <Text style={styles.emptyBody}>{t("emptyDescription")}</Text>
        </View>
      ) : (
        <SectionList
          ListHeaderComponent={
            hasUnread ? (
              <View
                style={{
                  paddingHorizontal: 24,
                  flexDirection: "row",
                  justifyContent: "flex-end",
                }}
              >
                <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
                  <Text style={styles.markAll}>{t("readAll")}</Text>
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
            <Text style={styles.sectionHeader}>
              {BUCKET_LABELS[title] ?? title}
            </Text>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    backgroundColor: Colors.textPrimary,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
  },
  headerTitle: {
    fontFamily: "Inter_900Black",
    fontSize: 28,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },
  markAll: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.pasion,
    textAlign: "right",
    width: 60,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: "Inter_900Black",
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 32,
  },
  sectionHeader: {
    fontFamily: "Inter_900Black",
    fontSize: 11,
    letterSpacing: 2,
    color: Colors.textMuted,
    textTransform: "uppercase",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
});
