import { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { ThemeColors } from '@/constants/colors';
import { useColors } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { Toast } from 'toastify-react-native';
import { apiDeleteAccount } from '@/lib/api';
import { Typography } from '@/components/ui/Typography';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();
  const { isPurchaser, entitlementData, presentCustomerCenter, restorePurchases } = useRevenueCat();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { t } = useTranslation('settings');
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  async function handleRestore() {
    try {
      await restorePurchases();
      Toast.success(
        t('restoreSuccess', {
          ns: 'home',
          defaultValue: 'Purchases restored!',
        })
      );
    } catch {
      Toast.error(
        t('restoreError', {
          ns: 'home',
          defaultValue: 'Could not restore purchases.',
        })
      );
    }
  }

  const MENU_ITEMS: {
    label: string;
    icon: string;
    route?: string;
    onPress?: () => void;
  }[] = [
    {
      label: t('menu.notifications'),
      route: '/settings/notifications',
      icon: 'notifications-outline',
    },
    {
      label: t('menu.feedback'),
      route: '/settings/feedback',
      icon: 'musical-notes-outline',
    },
    {
      label: t('menu.language'),
      route: '/settings/language',
      icon: 'language-outline',
    },
    {
      label: t('menu.fontSize'),
      route: '/settings/font-size',
      icon: 'text-outline',
    },
    {
      label: t('menu.theme'),
      route: '/settings/theme',
      icon: 'color-palette-outline',
    },
    {
      label: t('menu.country'),
      route: '/settings/country',
      icon: 'earth-outline',
    },
    {
      label: t('menu.relationship'),
      route: '/settings/relationship',
      icon: 'heart-outline',
    },
    ...(isPurchaser
      ? [
          {
            label: t('menu.subscription'),
            icon: 'card-outline',
            onPress: () => presentCustomerCenter(),
          },
        ]
      : !entitlementData?.premium
        ? [
            {
              label: t('menu.restorePurchases'),
              icon: 'refresh-outline',
              onPress: handleRestore,
            },
          ]
        : []),
    {
      label: t('menu.terms'),
      route: '/settings/terms',
      icon: 'document-text-outline',
    },
    {
      label: t('menu.privacy'),
      route: '/settings/privacy',
      icon: 'shield-checkmark-outline',
    },
    {
      label: t('menu.faq'),
      route: '/settings/faq',
      icon: 'help-circle-outline',
    },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.background} />
        </Pressable>
        <Typography variant="heading" style={styles.headerTitle}>
          {t('title')}
        </Typography>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View>
          {MENU_ITEMS.map((item, index) => (
            <Pressable
              key={index}
              style={styles.row}
              onPress={() => (item.onPress ? item.onPress() : router.push(item.route as any))}
            >
              <Ionicons name={item.icon as any} size={20} color={colors.textMuted} />
              <Typography variant="label" color={colors.textMuted}>
                {item.label}
              </Typography>
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <Button label={t('signOut')} onPress={() => setLogoutVisible(true)} variant="accent" />
          <Pressable onPress={() => setDeleteVisible(true)} style={styles.deleteAccountBtn}>
            <Typography variant="label" color={colors.pasion} style={styles.deleteAccountLabel}>
              {t('deleteAccount')}
            </Typography>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={logoutVisible}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setLogoutVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name="log-out-outline" size={28} color={colors.pasion} />
            </View>

            <Typography variant="heading" baseFontSize={20} style={styles.modalTitle}>
              {t('signOutConfirmTitle')}
            </Typography>
            <Typography
              variant="body"
              baseFontSize={14}
              baseLineHeight={21}
              color={colors.textSecondary}
              style={styles.modalBody}
            >
              {t('signOutConfirmMessage')}
            </Typography>

            <View style={styles.actions}>
              <Button
                label={t('signOut')}
                onPress={() => {
                  logout();
                  router.replace('/(auth)/welcome');
                }}
                variant="accent"
              />
              <Button
                label={t('cancel', { ns: 'common' })}
                onPress={() => setLogoutVisible(false)}
                variant="ghost"
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteVisible}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setDeleteVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={[styles.iconWrap, styles.deleteIconWrap]}>
              <Ionicons name="trash-outline" size={28} color={colors.pasion} />
            </View>

            <Typography variant="heading" baseFontSize={20} style={styles.modalTitle}>
              {t('deleteAccountConfirmTitle')}
            </Typography>
            <Typography
              variant="body"
              baseFontSize={14}
              baseLineHeight={21}
              color={colors.textSecondary}
              style={styles.modalBody}
            >
              {t('deleteAccountConfirmMessage')}
            </Typography>

            <View style={styles.actions}>
              <Button
                label={t('deleteAccount')}
                onPress={async () => {
                  setDeleteLoading(true);
                  try {
                    await apiDeleteAccount();
                    Toast.success(t('deleteAccountSuccess'));
                    logout();
                    router.replace('/(auth)/welcome');
                  } catch {
                    Toast.error(t('deleteAccountError', { defaultValue: 'Error' }));
                    setDeleteLoading(false);
                    setDeleteVisible(false);
                  }
                }}
                variant="accent"
                disabled={deleteLoading}
              />
              <Button
                label={t('cancel', { ns: 'common' })}
                onPress={() => setDeleteVisible(false)}
                variant="ghost"
                disabled={deleteLoading}
              />
            </View>
          </View>
        </View>
      </Modal>
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
      marginBottom: 8,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.textPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      color: colors.textPrimary,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'space-between',
    },
    row: {
      paddingVertical: 18,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'flex-end',
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 28,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255,59,92,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      letterSpacing: -0.3,
      textAlign: 'center',
      marginBottom: 10,
    },
    modalBody: {
      textAlign: 'center',
      marginBottom: 28,
      maxWidth: 280,
    },
    actions: {
      width: '100%',
      gap: 10,
    },
    deleteAccountBtn: {
      alignItems: 'center',
      paddingVertical: 12,
      marginTop: 4,
    },
    deleteAccountLabel: {
      opacity: 0.7,
    },
    deleteIconWrap: {
      backgroundColor: 'rgba(255,59,92,0.12)',
    },
  });
}
