import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Toggle } from '@/components/ui/toggle';
import { Typography } from '@/components/ui/Typography';
import { ThemeColors } from '@/constants/colors';
import { useColors } from '@/context/ThemeContext';
import {
  isHapticsEnabled,
  isSoundEnabled,
  previewHaptics,
  previewSound,
  setHapticsEnabled,
  setSoundEnabled,
} from '@/lib/feedback';

export default function FeedbackSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('settings');
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [sound, setSound] = useState(isSoundEnabled);
  const [haptics, setHaptics] = useState(isHapticsEnabled);

  function toggleSound() {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
    if (next) previewSound();
  }

  function toggleHaptics() {
    const next = !haptics;
    setHaptics(next);
    setHapticsEnabled(next);
    if (next) previewHaptics();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('feedback.back')}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.background} />
        </Pressable>
        <Typography variant="heading" style={styles.title}>
          {t('feedback.title')}
        </Typography>
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <View style={styles.rowCopy}>
            <Typography variant="bodyBold">{t('feedback.soundTitle')}</Typography>
            <Typography variant="body" color={colors.textSecondary}>
              {t('feedback.soundDescription')}
            </Typography>
          </View>
          <Toggle
            value={sound}
            onToggle={toggleSound}
            accessibilityLabel={t('feedback.soundTitle')}
          />
        </View>
        <View style={styles.row}>
          <View style={styles.rowCopy}>
            <Typography variant="bodyBold">{t('feedback.hapticsTitle')}</Typography>
            <Typography variant="body" color={colors.textSecondary}>
              {t('feedback.hapticsDescription')}
            </Typography>
          </View>
          <Toggle
            value={haptics}
            onToggle={toggleHaptics}
            accessibilityLabel={t('feedback.hapticsTitle')}
          />
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      paddingHorizontal: 20,
      paddingVertical: 14,
      marginBottom: 8,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.textPrimary,
    },
    title: { flex: 1, color: colors.textPrimary },
    content: { paddingHorizontal: 20 },
    row: {
      minHeight: 92,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rowCopy: { flex: 1, gap: 3 },
  });
}
