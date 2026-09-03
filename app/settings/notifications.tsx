import { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { ThemeColors } from '@/constants/colors';
import { useColors } from '@/context/ThemeContext';
import { Toggle } from '@/components/ui/toggle';
import { useNotifications } from '@/hooks/use-notifications';
import { Typography } from '@/components/ui/Typography';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isEnabled, enable, disable } = useNotifications();
  const { t } = useTranslation('settings');
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.background} />
        </Pressable>
        <Typography variant="heading" style={styles.headerTitle}>
          {t('notifications.title')}
        </Typography>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <View style={{ flex: 1 }}>
          <Typography variant="bodyBold">{t('notifications.toggleLabel')}</Typography>
          <Typography
            variant="body"
            color={colors.textSecondary}
            style={{ marginTop: 1, maxWidth: '90%' }}
          >
            {t('notifications.toggleDescription')}
          </Typography>
        </View>
        <Toggle value={isEnabled} onToggle={() => (isEnabled ? disable() : enable())} />
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      gap: 20,
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
  });
}
