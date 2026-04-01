import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { apiForgotPassword } from '../../lib/api';
import { AxiosError } from 'axios';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { t } = useTranslation('auth');

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
        <Text style={styles.title}>{t('forgotPassword.title')}</Text>

        {sent ? (
          <Text style={styles.subtitle}>{t('forgotPassword.successMessage')}</Text>
        ) : (
          <>
            <Text style={styles.subtitle}>{t('forgotPassword.subtitle')}</Text>

            <Text style={styles.label}>{t('forgotPassword.email')}</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder={t('forgotPassword.emailPlaceholder')}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

            {apiError && <Text style={styles.errorText}>{apiError}</Text>}
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
          <Text style={styles.backLinkText}>{t('forgotPassword.backToLogin')}</Text>
        </Pressable>
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
    marginBottom: 32,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderColor: '#EDF1F3',
  },
  inputError: {
    borderColor: Colors.pasion,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.pasion,
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
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
