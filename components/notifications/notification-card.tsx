import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/colors';
import { Typography } from '@/components/ui/Typography';

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
  data?: any;
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
  const { t } = useTranslation('notifications');
  const categoryColor = CATEGORY_COLORS[item.category] ?? Colors.textMuted;
  const categoryLabel = t(`category.${item.category}`, {
    defaultValue: item.category.toUpperCase(),
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {isUnread && <View style={styles.unreadDot} />}

      <View style={styles.topRow}>
        <View style={[styles.categoryPill, { borderColor: categoryColor }]}>
          <Typography variant="cardLabel" color={categoryColor} baseFontSize={9} style={{ opacity: 1, letterSpacing: 1.2 }}>
            {categoryLabel}
          </Typography>
        </View>
        <Typography variant="caption" color={Colors.textMuted}>
          {item.time}
        </Typography>
      </View>

      <Typography
        variant="bodyBold"
        baseFontSize={14}
        color={isUnread ? Colors.textPrimary : Colors.textSecondary}
        style={styles.title}
      >
        {item.title}
      </Typography>
      <Typography variant="body" baseFontSize={13} baseLineHeight={18} color={Colors.textMuted} numberOfLines={2}>
        {item.message}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardPressed: {
    opacity: 0.75,
  },
  unreadDot: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.pasion,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryPill: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  title: {
    marginBottom: 4,
  },
});
