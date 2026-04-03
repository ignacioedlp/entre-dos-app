import { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { ThemeColors } from '@/constants/colors';
import { useColors, useTheme } from '@/context/ThemeContext';
import { ThemeKey } from '@/lib/theme';
import { Typography } from '@/components/ui/Typography';

const THEME_OPTIONS: { key: ThemeKey; icon: string }[] = [
  { key: 'dark', icon: 'moon-outline' },
  { key: 'light', icon: 'sunny-outline' },
];

export default function ThemeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation('settings');
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.background} />
        </Pressable>
        <Typography variant="heading" style={styles.headerTitle}>
          {t('theme.title', { defaultValue: 'Tema' })}
        </Typography>
      </View>

      {THEME_OPTIONS.map((option, idx) => {
        const isSelected = theme === option.key;
        const label =
          option.key === 'dark'
            ? t('theme.dark', { defaultValue: 'Oscuro' })
            : t('theme.light', { defaultValue: 'Claro' });

        return (
          <Pressable
            key={option.key}
            onPress={() => setTheme(option.key)}
            style={[styles.row, idx === 0 && styles.rowFirst]}
          >
            <View style={styles.rowContent}>
              <Ionicons
                name={option.icon as any}
                size={22}
                color={colors.textMuted}
                style={styles.icon}
              />
              <Typography variant="bodyBold" style={styles.label}>
                {label}
              </Typography>
            </View>
            {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.accent} />}
          </Pressable>
        );
      })}
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
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 18,
      paddingHorizontal: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rowFirst: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rowContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      marginRight: 12,
    },
    label: {
      color: colors.textPrimary,
    },
  });
}
