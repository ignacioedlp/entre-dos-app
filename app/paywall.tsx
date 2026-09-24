import { useEffect, useMemo, useRef, useState } from 'react';
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
  const startedRef = useRef(false);
  const mountedRef = useRef(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    async function openPaywall() {
      try {
        await presentPaywall();
        if (mountedRef.current) {
          router.back();
        }
      } catch {
        if (mountedRef.current) setError(true);
      }
    }

    void openPaywall();
  }, [presentPaywall, router]);

  return (
    <View style={[styles.root, styles.centered]}>
      {!error && <ActivityIndicator color={colors.accent} size="large" />}
      <Typography
        variant="body"
        baseFontSize={14}
        color={colors.textMuted}
        style={styles.loadingText}
      >
        {t(error ? 'paywall.error' : 'paywall.loading')}
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
