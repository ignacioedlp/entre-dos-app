import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { useColors } from '@/context/ThemeContext';
import { ThemeColors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { AxiosError } from 'axios';
import { Typography } from '../../components/ui/Typography';
import { useScaledFontSize } from '../../context/FontScaleContext';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { resetPassword } = useAuth();
  const { t } = useTranslation('auth');
  const inputFontSize = useScaledFontSize(16);
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const schema = z
    .object({
      password: z.string().min(6, t('resetPassword.errorPasswordLength')),
      confirmPassword: z.string().min(1, t('resetPassword.errorPasswordConfirm')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('resetPassword.errorPasswordMatch'),
      path: ['confirmPassword'],
    });

  type FormData = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!token) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 24 }]}>
        <View style={styles.header}>
          <Logo size="lg" />
        </View>
        <View style={styles.content}>
          <Typography
            variant="swissTitle"
            baseFontSize={40}
            baseLineHeight={40}
            style={styles.title}
          >
            {t('resetPassword.title')}
          </Typography>
          <Typography variant="body" color={colors.textSecondary} style={styles.subtitle}>
            {t('resetPassword.errorInvalidToken')}
          </Typography>
        </View>
        <View style={[styles.ctaArea, { paddingBottom: insets.bottom + 24 }]}>
          <Pressable style={styles.backLink} onPress={() => router.replace('/(auth)/login')}>
            <Typography
              variant="body"
              baseFontSize={14}
              color={colors.textSecondary}
              style={styles.backLinkText}
            >
              {t('forgotPassword.backToLogin')}
            </Typography>
          </Pressable>
        </View>
      </View>
    );
  }

  const onSubmit = async (data: FormData) => {
    try {
      setApiError(null);
      const profile = await resetPassword(token, data.password);
      if (!profile.coupleId) router.replace('/(auth)/link');
      else if (!profile.onboardingCompleted) router.replace('/(auth)/onboarding');
      else router.replace('/(app)/');
    } catch (err) {
      const axiosErr = err as AxiosError<{ code?: string }>;
      const code = axiosErr.response?.data?.code;
      if (code === 'RESET_TOKEN_INVALID') {
        setApiError(t('resetPassword.errorExpiredToken'));
      } else {
        setApiError(t('resetPassword.errorGeneric'));
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.root, { paddingTop: insets.top + 24 }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Logo size="lg" />
          </View>

          <View style={styles.content}>
            <Typography
              variant="swissTitle"
              baseFontSize={40}
              baseLineHeight={40}
              style={styles.title}
            >
              {t('resetPassword.title')}
            </Typography>
            <Typography variant="body" color={colors.textSecondary} style={styles.subtitle}>
              {t('resetPassword.subtitle')}
            </Typography>

            <Typography variant="body" baseFontSize={14}>
              {t('resetPassword.password')}
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
                    placeholder={t('resetPassword.passwordPlaceholder')}
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

            <Typography variant="body" baseFontSize={14} style={styles.labelSpaced}>
              {t('resetPassword.passwordConfirm')}
            </Typography>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      { fontSize: inputFontSize },
                      errors.confirmPassword && styles.inputError,
                    ]}
                    placeholder={t('resetPassword.passwordPlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword((v) => !v)}
                    style={styles.eyeButton}
                    hitSlop={8}
                  >
                    <Feather
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </Pressable>
                </View>
              )}
            />
            {errors.confirmPassword && (
              <Typography variant="caption" color={colors.pasion} style={styles.errorText}>
                {errors.confirmPassword.message}
              </Typography>
            )}

            {apiError && (
              <Typography variant="caption" color={colors.pasion} style={styles.apiError}>
                {apiError}
              </Typography>
            )}
          </View>
        </ScrollView>

        <View style={[styles.ctaArea, { paddingBottom: insets.bottom + 24 }]}>
          <Button
            label={isSubmitting ? t('resetPassword.submitting') : t('resetPassword.submit')}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    keyboardAvoid: {
      flex: 1,
    },
    root: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 24,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
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
    labelSpaced: {
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
    errorText: {
      marginTop: 8,
    },
    apiError: {
      marginTop: 16,
    },
    ctaArea: {
      paddingTop: 16,
      gap: 10,
    },
    backLink: {
      alignSelf: 'center',
      paddingVertical: 8,
    },
    backLinkText: {
      textDecorationLine: 'underline',
    },
  });
}
