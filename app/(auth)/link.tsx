import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Share,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { useColors } from '@/context/ThemeContext';
import { ThemeColors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { apiGetCoupleStatus, apiLinkCouple } from '@/lib/api';
import { Typography } from '../../components/ui/Typography';

export default function WaitingScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'share' | 'join'>('share');
  const [code, setCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const { user, updateProfile } = useAuth();
  const coupleCode = user?.coupleCode ?? '------';
  const { t } = useTranslation('auth');
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: statusData } = useQuery({
    queryKey: ['couple-status'],
    queryFn: apiGetCoupleStatus,
    refetchInterval: 15_000,
    enabled: !user?.coupleId,
  });

  useEffect(() => {
    if (statusData?.linked && statusData.couple) {
      updateProfile({ ...user!, coupleId: statusData.couple.coupleId });
      router.replace('/(auth)/onboarding');
    }
  }, [statusData, updateProfile, user]);

  const linkMutation = useMutation({
    mutationFn: (linkCode: string) => apiLinkCouple(linkCode),
    onSuccess: (data) => {
      updateProfile({ ...user!, coupleId: data.coupleId });
      router.replace('/(auth)/onboarding');
    },
    onError: () => {
      setJoinError(t('link.errorInvalidCode'));
      setCode('');
      setTimeout(() => inputRef.current?.focus(), 150);
    },
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: t('link.shareMessage', { coupleCode }) + `\nentredos://join/${coupleCode}`,
      });
    } catch {}
  };

  const handleJoin = () => {
    if (code.length < 6) return;
    setJoinError(null);
    linkMutation.mutate(code);
  };

  const handleCodeChange = (text: string) => {
    setCode(text);
    if (text.length === 6) {
      setJoinError(null);
      linkMutation.mutate(text);
    }
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    const cleaned = text
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 6);
    if (cleaned.length > 0) {
      handleCodeChange(cleaned);
    }
  };

  const switchToJoin = () => {
    setMode('join');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const switchToShare = () => {
    setMode('share');
    setCode('');
    setJoinError(null);
    Keyboard.dismiss();
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(auth)/welcome');
  };

  if (mode === 'join') {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('link.back')}
              onPress={handleBack}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={22} color={colors.background} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <Typography
              variant="swissTitle"
              baseFontSize={40}
              baseLineHeight={40}
              style={styles.title}
            >
              {t('link.joinTitle')}
            </Typography>
            <Typography variant="body" color={colors.textSecondary} style={styles.subtitle}>
              {t('link.joinSubtitle')}
            </Typography>

            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={code}
              onChangeText={handleCodeChange}
              maxLength={6}
              autoFocus
              autoCapitalize="characters"
            />

            <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
              <View style={styles.digitRow}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <View
                    key={i}
                    style={[styles.digitBox, code.length === i && styles.digitBoxActive]}
                  >
                    <Typography variant="heading" baseFontSize={28} style={styles.digitText}>
                      {code[i] ?? ''}
                    </Typography>
                  </View>
                ))}
              </View>
            </TouchableWithoutFeedback>

            <TouchableOpacity onPress={handlePaste} style={styles.pasteBtn}>
              <Typography variant="body" baseFontSize={14} color={colors.accent}>
                {t('link.paste')}
              </Typography>
            </TouchableOpacity>

            {joinError && (
              <Typography variant="caption" color={colors.pasion} style={styles.errorText}>
                {joinError}
              </Typography>
            )}
          </View>

          <View style={[styles.ctaArea, { paddingBottom: insets.bottom + 24 }]}>
            <Button
              label={linkMutation.isPending ? t('link.connecting') : t('link.connect')}
              onPress={handleJoin}
              disabled={code.length < 6 || linkMutation.isPending}
            />
            <Button
              label={t('link.back')}
              variant="ghost"
              onPress={switchToShare}
              style={styles.secondaryBtn}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('link.back')}
          onPress={handleBack}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={colors.background} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.spinnerWrapper}>
          <Typography
            variant="swissTitle"
            baseFontSize={40}
            baseLineHeight={40}
            style={styles.title}
          >
            {t('link.shareTitle')}
          </Typography>
          <ActivityIndicator size="large" color={colors.accent} style={styles.spinner} />
        </View>

        <Typography variant="body" color={colors.textSecondary} style={styles.subtitle}>
          {t('link.shareSubtitle')}
        </Typography>

        <View style={styles.codeBox}>
          <Typography variant="heading" baseFontSize={42} style={styles.code}>
            {coupleCode}
          </Typography>
        </View>
      </View>

      <View style={[styles.ctaArea, { paddingBottom: insets.bottom + 24 }]}>
        <Button label={t('link.shareLink')} onPress={handleShare} />
        <Button
          label={t('link.haveCode')}
          variant="ghost"
          onPress={switchToJoin}
          style={styles.secondaryBtn}
        />
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 24,
    },
    header: {
      marginBottom: 48,
    },
    backBtn: {
      width: 40,
      height: 40,
      backgroundColor: colors.textPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 25,
    },
    content: {
      flex: 1,
    },
    title: {
      marginBottom: 12,
      letterSpacing: -1.5,
    },
    subtitle: {
      marginBottom: 40,
    },
    codeBox: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingVertical: 28,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    code: {
      letterSpacing: 10,
      textTransform: 'uppercase',
    },
    hiddenInput: {
      position: 'absolute',
      width: 1,
      height: 1,
      opacity: 0,
    },
    digitRow: {
      flexDirection: 'row',
      gap: 10,
    },
    digitBox: {
      flex: 1,
      aspectRatio: 0.75,
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    digitBoxActive: {
      borderColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
    },
    digitText: {
      letterSpacing: 0,
    },
    pasteBtn: {
      alignSelf: 'center',
      marginTop: 16,
      paddingVertical: 6,
      paddingHorizontal: 20,
    },
    errorText: {
      marginTop: 12,
    },
    ctaArea: {
      paddingTop: 16,
      gap: 12,
    },
    secondaryBtn: {},
    spinnerWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    spinner: {
      marginBottom: 20,
    },
  });
}
