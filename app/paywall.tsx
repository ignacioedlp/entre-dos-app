import { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ThemeColors } from '../constants/colors';
import { useColors } from '../context/ThemeContext';
import { useRevenueCat } from '../context/RevenueCatContext';
import { Typography } from '../components/ui/Typography';

export default function PaywallScreen() {
  const router = useRouter();
  const { t } = useTranslation('home');
  const { presentPaywall } = useRevenueCat();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const dismissedRef = useRef(false);

  useEffect(() => {
    async function openPaywall() {
      try {
        await presentPaywall();
      } finally {
        if (!dismissedRef.current) {
          dismissedRef.current = true;
          router.back();
        }
      }
    }

    openPaywall().catch(() => {
      if (!dismissedRef.current) {
        dismissedRef.current = true;
        router.back();
      }
    });

    return () => {
      if (!dismissedRef.current) {
        dismissedRef.current = true;
        router.back();
      }
    };
  }, [presentPaywall, router]);

  return (
    <View style={[styles.root, styles.centered]}>
      <ActivityIndicator color={colors.accent} size="large" />
      <Typography
        variant="body"
        baseFontSize={14}
        color={colors.textMuted}
        style={styles.loadingText}
      >
        {t('paywall.loading')}
      </Typography>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 12,
    },
  });
}
