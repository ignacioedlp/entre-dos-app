import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { useColors } from '@/context/ThemeContext';
import { ThemeColors } from '../../constants/colors';
import { apiForgotPassword } from '../../lib/api';
import { AxiosError } from 'axios';
import { Typography } from '../../components/ui/Typography';
import { useScaledFontSize } from '../../context/FontScaleContext';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { t } = useTranslation('auth');
  const inputFontSize = useScaledFontSize(16);
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const schema = z.object({
    email: z.string().email(t('forgotPassword.errorEmail')),
  });
  type FormData = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setApiError(null);
      await apiForgotPassword(data.email);
      setSent(true);
    } catch (err) {
      const axiosErr = err as AxiosError<{ code?: string }>;
      const code = axiosErr.response?.data?.code;
      if (code === 'GOOGLE_ACCOUNT') {
        setApiError(t('forgotPassword.errorGoogleAccount'));
      } else {
        setSent(true);
      }
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24 }]}>
      <View style={styles.header}>
        <Logo size="lg" />
      </View>

      <View style={styles.content}>
        <Typography variant="swissTitle" baseFontSize={40} baseLineHeight={40} style={styles.title}>
          {t('forgotPassword.title')}
        </Typography>

        {sent ? (
          <Typography variant="body" color={colors.textSecondary} style={styles.subtitle}>
            {t('forgotPassword.successMessage')}
          </Typography>
        ) : (
          <>
            <Typography variant="body" color={colors.textSecondary} style={styles.subtitle}>
              {t('forgotPassword.subtitle')}
            </Typography>

            <Typography variant="body" baseFontSize={14}>
              {t('forgotPassword.email')}
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
                  placeholder={t('forgotPassword.emailPlaceholder')}
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

            {apiError && (
              <Typography variant="caption" color={colors.pasion} style={styles.errorText}>
                {apiError}
              </Typography>
            )}
          </>
        )}
      </View>

      <View style={[styles.ctaArea, { paddingBottom: insets.bottom + 24 }]}>
        {!sent && (
          <Button
            label={isSubmitting ? t('forgotPassword.submitting') : t('forgotPassword.submit')}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          />
        )}

        <Pressable style={styles.backLink} onPress={() => router.back()}>
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
    errorText: {
      marginTop: 8,
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
