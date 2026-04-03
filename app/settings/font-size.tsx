import { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { ThemeColors } from '@/constants/colors';
import { useColors } from '@/context/ThemeContext';
import { FONT_SCALES, FontScaleKey } from '@/lib/font-scale';
import { useFontScale } from '@/context/FontScaleContext';
import { Typography } from '@/components/ui/Typography';

const SCALE_ORDER: FontScaleKey[] = ['small', 'default', 'large', 'extraLarge'];

export default function FontSizeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { scale, setScale } = useFontScale();
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
          {t('fontSize.title')}
        </Typography>
      </View>

      {SCALE_ORDER.map((key, idx) => {
        const isSelected = scale === key;
        const multiplier = FONT_SCALES[key].multiplier;
        return (
          <Pressable
            key={key}
            onPress={() => setScale(key)}
            style={[styles.row, idx === 0 && styles.rowFirst]}
          >
            <View style={styles.rowContent}>
              <Typography variant="bodyBold" style={styles.optionLabel}>
                {t(`fontSize.${key}`)}
              </Typography>
              <Typography
                variant="heading"
                style={{ fontSize: Math.round(22 * multiplier) }}
                color={colors.textMuted}
              >
                Aa
              </Typography>
            </View>
            {isSelected && (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={colors.accent}
                style={{ marginLeft: 16 }}
              />
            )}
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
      paddingVertical: 14,
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
      gap: 16,
    },
    optionLabel: {
      color: colors.textPrimary,
      flex: 1,
    },
  });
}
