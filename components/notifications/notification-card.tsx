import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";

export interface NotificationItem {
  id: string;
  category: string;
  categoryKey?: string;
  title: string;
  message: string;
  time: string;
  read?: boolean;
  urgent?: boolean;
  actions?: string[];
}

const CATEGORY_COLORS: Record<string, string> = {
  played: Colors.pasion,
  system: Colors.rara,
};

export function NotificationCard({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress?: () => void;
}) {
  const isUnread = item.read === false;
  const categoryColor =
    CATEGORY_COLORS[item.categoryKey ?? item.category] ?? Colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isUnread && styles.cardUnread,
        pressed && styles.cardPressed,
      ]}
    >
      {isUnread && <View style={styles.unreadDot} />}

      <View style={styles.topRow}>
        <View style={[styles.categoryPill, { borderColor: categoryColor }]}>
          <Text style={[styles.categoryText, { color: categoryColor }]}>
            {item.categoryKey?.toUpperCase() ?? item.category.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.time}>{item.time}</Text>
      </View>

      <Text style={[styles.title, isUnread && styles.titleUnread]}>
        {item.title}
      </Text>
      <Text style={styles.message} numberOfLines={2}>
        {item.message}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardUnread: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: "rgba(255,59,92,0.2)",
  },
  cardPressed: {
    opacity: 0.75,
  },
  unreadDot: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.pasion,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingRight: 16,
  },
  categoryPill: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 1.2,
  },
  time: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  titleUnread: {
    color: Colors.textPrimary,
  },
  message: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
  },
});
