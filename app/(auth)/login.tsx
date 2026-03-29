import { View, Text, TextInput, StyleSheet, Pressable, Modal } from 'react-native';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { useAuth, DeletionPendingError } from '../../context/AuthContext';
import { apiCancelDeletion } from '../../lib/api';
import { setToken, setProfile } from '../../lib/storage';
import i18n from '@/i18n';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [deletionPending, setDeletionPending] = useState<{
    scheduledFor: string;
    credentials: { email: string; password: string } | { idToken: string };
  } | null>(null);
  const [cancellingDeletion, setCancellingDeletion] = useState(false);
  const { login, googleLogin, updateProfile } = useAuth();
  const { t } = useTranslation('auth');

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
          credentials: { idToken: err.idToken },
        });
      } else {
        setApiError(t('login.errorGoogle'));
      }
    } finally {
      setGoogleLoading(false);
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
        <Text style={styles.title}>{t('login.title')}</Text>
        <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

        <Text style={styles.label}>{t('login.email')}</Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder={t('login.emailPlaceholder')}
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

        <Text style={[styles.label, styles.labelPassword]}>{t('login.password')}</Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                placeholder={t('login.passwordPlaceholder')}
                placeholderTextColor={Colors.textMuted}
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
                  color={Colors.textMuted}
                />
              </Pressable>
            </View>
          )}
        />
        {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

        <Pressable style={styles.forgotLink} onPress={() => router.push('/(auth)/forgot-password')}>
          <Text style={styles.forgotText}>{t('login.forgotPassword')}</Text>
        </Pressable>

        {apiError && <Text style={styles.errorText}>{apiError}</Text>}
      </View>

      <View style={[styles.ctaArea, { paddingBottom: insets.bottom + 24 }]}>
        <Button
          label={isSubmitting ? t('login.submitting') : t('login.submit')}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('login.or')}</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.googleButton, pressed && styles.googleButtonPressed]}
          onPress={handleGoogleLogin}
          disabled={googleLoading || isSubmitting}
        >
          <AntDesign name="google" size={18} color="#1a1a1a" />
          <Text style={styles.googleLabel}>
            {googleLoading ? t('login.submitting') : t('login.google')}
          </Text>
        </Pressable>

        <Pressable style={styles.registerLink} onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.registerLinkText}>
            {t('login.noAccount')}
            <Text style={styles.registerLinkAccent}>{t('login.registerLink')}</Text>
          </Text>
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
              <Ionicons name="warning-outline" size={28} color={Colors.pasion} />
            </View>
            <Text style={styles.modalTitle}>{t('login.deletionPendingTitle')}</Text>
            <Text style={styles.modalBody}>
              {t('login.deletionPendingMessage', { date: deletionPending?.scheduledFor })}
            </Text>
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
  labelPassword: {
    marginTop: 24,
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
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
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
  googleLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    letterSpacing: 0.3,
    color: '#1a1a1a',
  },
  registerLink: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  registerLinkText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  registerLinkAccent: {
    fontFamily: 'Inter_700Bold',
    color: Colors.accent,
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
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: Colors.border,
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
    fontFamily: 'Inter_900Black',
    fontSize: 20,
    letterSpacing: -0.3,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: 280,
  },
  modalActions: {
    width: '100%',
    gap: 10,
  },
});
