import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Colors } from '@/constants/colors';
import { Toggle } from '@/components/ui/toggle';
import { useNotifications } from '@/hooks/use-notifications';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isEnabled, enable, disable } = useNotifications();
  const { t } = useTranslation('settings');

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.background} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
      </View>
      {/* Notifications toggle */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.pasion + '18',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <MaterialIcons name="notifications-none" size={20} color={Colors.pasion} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 16,
              color: Colors.textPrimary,
            }}
          >
            {t('notifications.toggleLabel')}
          </Text>
          <Text
            style={{
              color: Colors.textSecondary,
              marginTop: 1,
              maxWidth: '90%',
            }}
          >
            {t('notifications.toggleDescription')}
          </Text>
        </View>
        <Toggle value={isEnabled} onToggle={() => (isEnabled ? disable() : enable())} />
      </View>
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
    paddingHorizontal: 20,
    gap: 20,
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
    fontFamily: 'Inter_900Black',
    fontSize: 28,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },
});
