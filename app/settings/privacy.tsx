import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useColors } from '@/context/ThemeContext';
import { ThemeColors } from '@/constants/colors';
import { Typography } from '@/components/ui/Typography';
import { useMemo } from 'react';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('settings');
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const items = t('privacy.items', { returnObjects: true }) as {
    title: string;
    body: string;
  }[];

  return (
    <View style={styles.root}>
      <View style={styles.handle} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Typography variant="heading" baseFontSize={24} style={styles.title}>
          {t('privacy.title')}
        </Typography>
        <Typography variant="caption" color={colors.textMuted} style={styles.lastUpdated}>
          {t('privacy.lastUpdated')}
        </Typography>

        {items.map((item) => (
          <View key={item.title} style={styles.section}>
            <Typography variant="bodyBold" baseFontSize={14} style={styles.sectionTitle}>
              {item.title}
            </Typography>
            <Typography
              variant="body"
              baseFontSize={13}
              baseLineHeight={20}
              color={colors.textSecondary}
            >
              {item.body}
            </Typography>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surface,
      paddingTop: 12,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 20,
    },
    scrollContent: {
      paddingHorizontal: 24,
    },
    title: {
      letterSpacing: -0.5,
      marginBottom: 4,
    },
    lastUpdated: {
      marginBottom: 24,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      marginBottom: 6,
    },
  });
}
