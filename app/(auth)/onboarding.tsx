import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { apiCompleteOnboarding } from '@/lib/api';
import i18n from '@/i18n';
import { SUPPORTED_COUNTRIES, LANGUAGES } from '@/lib/countries';

const STEPS = [
  { icon: 'calendar-outline' as const, key: 'Step1' },
  { icon: 'swap-vertical-outline' as const, key: 'Step2' },
  { icon: 'heart-outline' as const, key: 'Step3' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuth();
  const { t, i18n: languageI18n } = useTranslation('auth');

  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [country, setCountry] = useState<string | null>(user?.country ?? null);
  const [locale, setLocale] = useState<'es' | 'en'>(user?.locale ?? 'es');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TOTAL_STEPS = 4;
  const LAST_STEP = TOTAL_STEPS - 1;

  const getCountryName = (supportedCountry: (typeof SUPPORTED_COUNTRIES)[number]) => {
    if (languageI18n.language.startsWith('es')) {
      return supportedCountry.name_es;
    }
    return supportedCountry.name_en;
  };

  const handleContinue = () => {
    setStep((s) => s + 1);
  };

  const handleComplete = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await apiCompleteOnboarding(displayName.trim(), locale, country);
      updateProfile(updated);
      i18n.changeLanguage(locale);
      router.replace('/(app)/');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
        <View style={styles.header}>
          <Logo size="sm" />
          <View style={styles.dots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>
        </View>

        <View style={styles.content}>
          {step === 0 && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
              <Text style={styles.title}>{t('onboarding.nameTitle')}</Text>
              <Text style={styles.subtitle}>{t('onboarding.nameSubtitle')}</Text>

              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t('onboarding.namePlaceholder')}
                placeholderTextColor={Colors.textMuted}
                autoFocus
                maxLength={30}
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (displayName.trim()) handleContinue();
                }}
              />
            </Animated.View>
          )}

          {step === 1 && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
              <Text style={styles.title}>{t('onboarding.countryTitle')}</Text>
              <Text style={styles.subtitle}>{t('onboarding.countrySubtitle')}</Text>

              <View style={styles.countryGrid}>
                {SUPPORTED_COUNTRIES.map((supportedCountry) => {
                  const isSelected = country === supportedCountry.code;
                  return (
                    <Pressable
                      key={supportedCountry.code}
                      onPress={() => setCountry(supportedCountry.code)}
                      style={[styles.countryCard, isSelected && styles.countryCardSelected]}
                    >
                      <Text style={styles.countryFlag}>{supportedCountry.flag}</Text>
                      <Text style={styles.countryLabel}>{getCountryName(supportedCountry)}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable style={styles.skipCountryButton} onPress={handleContinue}>
                <Text style={styles.skipCountryText}>{t('onboarding.countrySkip')}</Text>
              </Pressable>
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
              <Text style={styles.title}>{t('onboarding.languageTitle')}</Text>
              <Text style={styles.subtitle}>{t('onboarding.languageSubtitle')}</Text>

              <View style={styles.languageList}>
                {LANGUAGES.map((lang) => {
                  const isSelected = locale === lang.locale;
                  return (
                    <Pressable
                      key={lang.locale}
                      onPress={() => setLocale(lang.locale)}
                      style={[styles.languageRow, isSelected && styles.languageRowSelected]}
                    >
                      {lang.flag}
                      <Text style={styles.languageLabel}>{lang.label}</Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={22} color={Colors.accent} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {step === 3 && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
              <Text style={styles.title}>{t('onboarding.explainTitle')}</Text>

              <View style={styles.explainList}>
                {STEPS.map((s, idx) => (
                  <Animated.View
                    key={s.key}
                    entering={FadeInUp.delay(idx * 150).duration(400)}
                    style={styles.explainItem}
                  >
                    <View style={styles.explainIcon}>
                      <Ionicons name={s.icon} size={24} color={Colors.accent} />
                    </View>
                    <View style={styles.explainText}>
                      <Text style={styles.explainItemTitle}>
                        {t(`onboarding.explainStep${idx + 1}Title` as any)}
                      </Text>
                      <Text style={styles.explainItemBody}>
                        {t(`onboarding.explainStep${idx + 1}` as any)}
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}
            </Animated.View>
          )}
        </View>

        <View style={[styles.ctaArea, { paddingBottom: insets.bottom + 24 }]}>
          {step < LAST_STEP ? (
            <Button
              label={t('onboarding.continue')}
              onPress={handleContinue}
              disabled={step === 0 && !displayName.trim()}
            />
          ) : (
            <Button
              label={submitting ? t('onboarding.completing') : t('onboarding.letsGo')}
              onPress={handleComplete}
              disabled={submitting}
            />
          )}
        </View>

        {submitting && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 48,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.accent,
    width: 24,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
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
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  languageList: {
    gap: 12,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 14,
  },
  languageRowSelected: {
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  languageLabel: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: Colors.textPrimary,
  },
  countryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  countryCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  countryCardSelected: {
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  countryFlag: {
    fontSize: 26,
  },
  countryLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  skipCountryButton: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  skipCountryText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
  explainList: {
    gap: 20,
    marginTop: 8,
  },
  explainItem: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  explainIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  explainText: {
    flex: 1,
    gap: 4,
  },
  explainItemTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  explainItemBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.pasion,
    marginTop: 16,
  },
  ctaArea: {
    paddingTop: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 12, 16, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
