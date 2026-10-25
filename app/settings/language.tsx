import { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { ThemeColors } from '@/constants/colors';
import { useColors } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { apiUpdateLocale } from '@/lib/api';
import i18n from '@/i18n';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '@/lib/countries';
import { Typography } from '@/components/ui/Typography';

export default function LanguageScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  async function handleSelect(locale: 'es' | 'en' | 'pt') {
    if (loading || locale === user?.locale) return;
    setLoading(true);
    try {
      const updated = await apiUpdateLocale(locale);
      updateProfile(updated);
      i18n.changeLanguage(locale);
      queryClient.invalidateQueries();
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.background} />
        </Pressable>
        <Typography variant="heading" style={styles.headerTitle}>
          {t('language.title')}
        </Typography>
      </View>

      {LANGUAGES.map((lang, idx) => {
        const isSelected = user?.locale === lang.locale;
        return (
          <Pressable
            key={lang.locale}
            onPress={() => handleSelect(lang.locale)}
            disabled={loading}
            style={[styles.row, idx === 0 && styles.rowFirst, loading && styles.rowDisabled]}
          >
            {lang.flag}
            <Typography variant="bodyBold" style={styles.label}>
              {lang.label}
            </Typography>
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
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    rowFirst: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rowDisabled: {
      opacity: 0.5,
    },
    label: {
      flex: 1,
      color: colors.textPrimary,
    },
  });
}
