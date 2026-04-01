import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Share,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { apiGetCoupleStatus, apiLinkCouple } from '@/lib/api';

export default function WaitingScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'share' | 'join'>('share');
  const [code, setCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const { user, updateProfile } = useAuth();
  const coupleCode = user?.coupleCode ?? '------';
  const { t } = useTranslation('auth');

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
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
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

  if (mode === 'join') {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
          <View style={styles.header}>
            <Logo size="sm" />
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>{t('link.joinTitle')}</Text>
            <Text style={styles.subtitle}>{t('link.joinSubtitle')}</Text>

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
                    <Text style={styles.digitText}>{code[i] ?? ''}</Text>
                  </View>
                ))}
              </View>
            </TouchableWithoutFeedback>

            <TouchableOpacity onPress={handlePaste} style={styles.pasteBtn}>
              <Text style={styles.pasteBtnText}>{t('link.paste')}</Text>
            </TouchableOpacity>

            {joinError && <Text style={styles.errorText}>{joinError}</Text>}
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
        <Logo size="sm" />
      </View>

      <View style={styles.content}>
        <View style={styles.spinnerWrapper}>
          <Text style={styles.title}>{t('link.shareTitle')}</Text>
          <ActivityIndicator size="large" color={Colors.accent} style={styles.spinner} />
        </View>

        <Text style={styles.subtitle}>{t('link.shareSubtitle')}</Text>

        <View style={styles.codeBox}>
          <Text style={styles.code}>{coupleCode}</Text>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 48,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: 'Inter_900Black',
    fontSize: 40,
    lineHeight: 40,
    textTransform: 'uppercase',
    letterSpacing: -1.5,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
    marginBottom: 40,
  },
  codeBox: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  code: {
    fontFamily: 'Inter_900Black',
    fontSize: 42,
    letterSpacing: 10,
    color: Colors.textPrimary,
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
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitBoxActive: {
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  digitText: {
    fontFamily: 'Inter_900Black',
    fontSize: 28,
    color: Colors.textPrimary,
  },
  pasteBtn: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  pasteBtnText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.accent,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.pasion,
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
