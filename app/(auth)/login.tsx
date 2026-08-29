import { View, TextInput, StyleSheet, Pressable, Modal, Platform } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { useColors } from '@/context/ThemeContext';
import { ThemeColors } from '../../constants/colors';
import { useAuth, DeletionPendingError } from '../../context/AuthContext';
import { apiCancelDeletion } from '../../lib/api';
import { setToken, setProfile } from '../../lib/storage';
import i18n from '@/i18n';
import { Typography } from '../../components/ui/Typography';
import { useScaledFontSize } from '../../context/FontScaleContext';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [deletionPending, setDeletionPending] = useState<{
    scheduledFor: string;
    credentials:
      | { email: string; password: string }
      | { idToken: string; provider: 'google' | 'apple' };
  } | null>(null);
  const [cancellingDeletion, setCancellingDeletion] = useState(false);
  const { login, googleLogin, appleLogin, updateProfile } = useAuth();
  const { t } = useTranslation('auth');
  const inputFontSize = useScaledFontSize(16);
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync()
        .then(setAppleAvailable)
        .catch(() => setAppleAvailable(false));
    }
  }, []);

  const schema = z.object({
    email: z.string().email(t('login.errorEmail')),
    password: z.string().min(1, t('login.errorPassword')),
  });
  type FormData = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const navigateAfterLogin = (profile: {
    coupleId?: string | null;
    onboardingCompleted?: boolean;
  }) => {
    if (!profile.coupleId) router.replace('/(auth)/link');
    else if (!profile.onboardingCompleted) router.replace('/(auth)/onboarding');
    else router.replace('/(app)/');
  };

  const handleGoogleLogin = async () => {
    try {
      setApiError(null);
      setGoogleLoading(true);
      const profile = await googleLogin();
      navigateAfterLogin(profile);
    } catch (err) {
      if (err instanceof DeletionPendingError && err.idToken) {
        setDeletionPending({
          scheduledFor: err.deletionScheduledFor,
          credentials: { idToken: err.idToken, provider: 'google' },
        });
      } else {
        setApiError(t('login.errorGoogle'));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (appleLoading || googleLoading || isSubmitting) return;
    try {
      setApiError(null);
      setAppleLoading(true);
      const profile = await appleLogin();
      navigateAfterLogin(profile);
    } catch (err: any) {
      if (err instanceof DeletionPendingError && err.idToken && err.provider) {
        setDeletionPending({
          scheduledFor: err.deletionScheduledFor,
          credentials: { idToken: err.idToken, provider: err.provider },
        });
      } else if (err?.code !== 'ERR_REQUEST_CANCELED') {
        setApiError(t('login.errorApple'));
      }
    } finally {
      setAppleLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setApiError(null);
      const profile = await login(data.email, data.password);
      navigateAfterLogin(profile);
    } catch (err) {
      if (err instanceof DeletionPendingError) {
        setDeletionPending({
          scheduledFor: err.deletionScheduledFor,
          credentials: { email: data.email, password: data.password },
        });
      } else {
        setApiError(t('login.errorInvalid'));
      }
    }
  };

  const handleCancelDeletion = async () => {
    if (!deletionPending) return;
    setCancellingDeletion(true);
    try {
      const { accessToken, profile } = await apiCancelDeletion(deletionPending.credentials);
      setToken(accessToken);
      setProfile(profile);
      updateProfile(profile);
      i18n.changeLanguage(profile.locale);
      setDeletionPending(null);
      navigateAfterLogin(profile);
    } catch {
      setDeletionPending(null);
      setApiError(t('login.errorInvalid'));
    } finally {
      setCancellingDeletion(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24 }]}>
      <View style={styles.header}>
        <Logo size="lg" />
      </View>

      <View style={styles.content}>
        <Typography variant="swissTitle" baseFontSize={40} baseLineHeight={40} style={styles.title}>
          {t('login.title')}
        </Typography>
        <Typography variant="body" color={colors.textSecondary} style={styles.subtitle}>
          {t('login.subtitle')}
        </Typography>

        <Typography variant="body" baseFontSize={14}>
          {t('login.email')}
        </Typography>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, { fontSize: inputFontSize }, errors.email && styles.inputError]}
              placeholder={t('login.emailPlaceholder')}
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.email && (
          <Typography variant="caption" color={colors.pasion} style={styles.errorText}>
            {errors.email.message}
          </Typography>
        )}

        <Typography variant="body" baseFontSize={14} style={styles.labelPassword}>
          {t('login.password')}
        </Typography>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  { fontSize: inputFontSize },
                  errors.password && styles.inputError,
                ]}
                placeholder={t('login.passwordPlaceholder')}
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeButton}
                hitSlop={8}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          )}
        />
        {errors.password && (
          <Typography variant="caption" color={colors.pasion} style={styles.errorText}>
            {errors.password.message}
          </Typography>
        )}

        <Pressable style={styles.forgotLink} onPress={() => router.push('/(auth)/forgot-password')}>
          <Typography variant="caption" color={colors.textSecondary} style={styles.forgotText}>
            {t('login.forgotPassword')}
          </Typography>
        </Pressable>

        {apiError && (
          <Typography variant="caption" color={colors.pasion} style={styles.errorText}>
            {apiError}
          </Typography>
        )}
      </View>

      <View style={[styles.ctaArea, { paddingBottom: insets.bottom + 24 }]}>
        <Button
          label={isSubmitting ? t('login.submitting') : t('login.submit')}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Typography variant="caption" color={colors.textMuted}>
            {t('login.or')}
          </Typography>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.googleButton, pressed && styles.googleButtonPressed]}
          onPress={handleGoogleLogin}
          disabled={googleLoading || isSubmitting}
        >
          <AntDesign name="google" size={18} color="#1a1a1a" />
          <Typography variant="button" color="#1a1a1a">
            {googleLoading ? t('login.submitting') : t('login.google')}
          </Typography>
        </Pressable>

        {Platform.OS === 'ios' && appleAvailable && (
          <View style={styles.appleButtonWrapper}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={9999}
              style={styles.appleButton}
              onPress={handleAppleLogin}
            />
          </View>
        )}

        <Pressable style={styles.registerLink} onPress={() => router.push('/(auth)/register')}>
          <Typography variant="body" baseFontSize={14} color={colors.textSecondary}>
            {t('login.noAccount')}
            <Typography
              variant="bodyBold"
              baseFontSize={14}
              color={colors.accent}
              style={styles.registerLinkAccent}
            >
              {t('login.registerLink')}
            </Typography>
          </Typography>
        </Pressable>
      </View>

      <Modal
        visible={!!deletionPending}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setDeletionPending(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name="warning-outline" size={28} color={colors.pasion} />
            </View>
            <Typography variant="heading" baseFontSize={20} style={styles.modalTitle}>
              {t('login.deletionPendingTitle')}
            </Typography>
            <Typography
              variant="body"
              baseFontSize={14}
              baseLineHeight={21}
              color={colors.textSecondary}
              style={styles.modalBody}
            >
              {t('login.deletionPendingMessage', { date: deletionPending?.scheduledFor })}
            </Typography>
            <View style={styles.modalActions}>
              <Button
                label={t('login.cancelDeletion')}
                onPress={handleCancelDeletion}
                variant="accent"
                disabled={cancellingDeletion}
              />
              <Button
                label={t('cancel', { ns: 'common' })}
                onPress={() => setDeletionPending(null)}
                variant="ghost"
                disabled={cancellingDeletion}
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
      paddingHorizontal: 24,
    },
    header: {
      marginBottom: 48,
    },
    content: {
      flex: 1,
    },
    title: {
      marginBottom: 12,
      letterSpacing: -1.5,
    },
    subtitle: {
      marginBottom: 32,
    },
    labelPassword: {
      marginTop: 24,
    },
    input: {
      paddingHorizontal: 18,
      paddingVertical: 16,
      fontFamily: 'Inter_400Regular',
      color: colors.textPrimary,
      borderBottomWidth: 1,
      borderColor: '#EDF1F3',
    },
    inputError: {
      borderColor: colors.pasion,
    },
    passwordWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    passwordInput: {
      flex: 1,
    },
    eyeButton: {
      position: 'absolute',
      right: 4,
      paddingVertical: 16,
      paddingHorizontal: 8,
    },
    forgotLink: {
      alignSelf: 'flex-end',
      marginTop: 12,
    },
    forgotText: {
      textDecorationLine: 'underline',
    },
    errorText: {
      marginTop: 8,
    },
    ctaArea: {
      paddingTop: 16,
      gap: 10,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: '#ffffff',
      borderRadius: 9999,
      paddingVertical: 16,
    },
    appleButtonWrapper: {
      height: 56,
      marginTop: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.64)',
      borderRadius: 9999,
      paddingHorizontal: 1,
      paddingVertical: 3,
    },
    appleButton: {
      flex: 1,
    },
    googleButtonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    registerLink: {
      alignSelf: 'center',
      paddingVertical: 8,
    },
    registerLinkAccent: {
      textDecorationLine: 'underline',
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
    modalActions: {
      width: '100%',
      gap: 10,
    },
  });
}
