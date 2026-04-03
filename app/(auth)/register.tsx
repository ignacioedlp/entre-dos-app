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
import { AntDesign, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { useColors } from '@/context/ThemeContext';
import { ThemeColors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { Typography } from '../../components/ui/Typography';
import { useScaledFontSize } from '../../context/FontScaleContext';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register, googleLogin } = useAuth();
  const { t } = useTranslation('auth');
  const inputFontSize = useScaledFontSize(16);
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const schema = z
    .object({
      email: z.string().email(t('register.errorEmail')),
      password: z.string().min(6, t('register.errorPasswordLength')),
      confirmPassword: z.string().min(1, t('register.errorPasswordConfirm')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('register.errorPasswordMatch'),
      path: ['confirmPassword'],
    });

  type FormData = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const handleGoogleLogin = async () => {
    try {
      setApiError(null);
      setGoogleLoading(true);
      const profile = await googleLogin();
      if (!profile.coupleId) router.replace('/(auth)/link');
      else if (!profile.onboardingCompleted) router.replace('/(auth)/onboarding');
      else router.replace('/(app)/');
    } catch {
      setApiError(t('register.errorGeneric'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setApiError(null);
      await register(data.email, data.password, data.confirmPassword);
      router.replace('/(auth)/link');
    } catch {
      setApiError(t('register.errorGeneric'));
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
              {t('register.title')}
            </Typography>
            <Typography variant="body" color={colors.textSecondary} style={styles.subtitle}>
              {t('register.subtitle')}
            </Typography>

            <Typography variant="body" baseFontSize={14}>
              {t('register.email')}
            </Typography>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    { fontSize: inputFontSize },
                    errors.email && styles.inputError,
                  ]}
                  placeholder={t('register.emailPlaceholder')}
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

            <Typography variant="body" baseFontSize={14} style={styles.labelSpaced}>
              {t('register.password')}
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
                    placeholder={t('register.passwordPlaceholder')}
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
              {t('register.passwordConfirm')}
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
                    placeholder={t('register.passwordPlaceholder')}
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

            <Typography
              variant="caption"
              color={colors.textSecondary}
              style={styles.termsAndConditions}
            >
              {t('register.termsAndConditions')}
            </Typography>
          </View>
        </ScrollView>

        <View style={[styles.ctaArea, { paddingBottom: insets.bottom + 24 }]}>
          <Button
            label={isSubmitting ? t('register.submitting') : t('register.submit')}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Typography variant="caption" color={colors.textMuted}>
              {t('register.or')}
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
              {googleLoading ? t('register.submitting') : t('register.google')}
            </Typography>
          </Pressable>

          <Pressable style={styles.loginLink} onPress={() => router.replace('/(auth)/login')}>
            <Typography variant="body" baseFontSize={14} color={colors.textSecondary}>
              {t('register.hasAccount')}
              <Typography
                variant="bodyBold"
                baseFontSize={14}
                color={colors.accent}
                style={styles.loginLinkAccent}
              >
                {t('register.signInLink')}
              </Typography>
            </Typography>
          </Pressable>
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
    termsAndConditions: {
      marginTop: 16,
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
    googleButtonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    loginLink: {
      alignSelf: 'center',
      paddingVertical: 8,
    },
    loginLinkAccent: {
      textDecorationLine: 'underline',
    },
  });
}
