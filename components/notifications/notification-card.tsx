import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemeColors, Colors, darkColors } from '@/constants/colors';
import { useColors } from '@/context/ThemeContext';
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

// Rarity-based colors don't change with theme
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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const categoryColor = CATEGORY_COLORS[item.category] ?? colors.textMuted;
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
          <Typography
            variant="cardLabel"
            color={categoryColor}
            baseFontSize={9}
            style={{ opacity: 1, letterSpacing: 1.2 }}
          >
            {categoryLabel}
          </Typography>
        </View>
        <Typography variant="caption" color={colors.textMuted}>
          {item.time}
        </Typography>
      </View>

      <Typography
        variant="bodyBold"
        baseFontSize={14}
        color={isUnread ? colors.textPrimary : colors.textSecondary}
        style={styles.title}
      >
        {item.title}
      </Typography>
      <Typography
        variant="body"
        baseFontSize={13}
        baseLineHeight={18}
        color={colors.textMuted}
        numberOfLines={2}
      >
        {item.message}
      </Typography>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      paddingVertical: 16,
      marginHorizontal: 24,
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor:
        colors.background === darkColors.background ? 'rgba(255, 255, 255, 0.16)' : colors.border,
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
      backgroundColor: colors.pasion,
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
}
