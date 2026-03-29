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
import { Svg, G, Path, Defs, ClipPath } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { apiCompleteOnboarding } from '@/lib/api';
import i18n from '@/i18n';

const LANGUAGES = [
  {
    locale: 'es' as const,
    label: 'Español',
    flag: (
      <Svg width={28} height={28} fill="none" viewBox="0 0 24 24">
        <G clipPath="url(#AR_svg__a)">
          <Path
            d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z"
            fill="#F0F0F0"
          />
          <Path
            d="M12-.001A12 12 0 001.192 6.782H22.81A12 12 0 0012-.001zm0 24a12 12 0 0010.81-6.783H1.191A12 12 0 0012.001 24z"
            fill="#338AF3"
          />
          <Path
            d="M15.586 12l-1.465.69.78 1.419-1.591-.305-.202 1.608L12 14.229l-1.109 1.183-.201-1.608-1.592.305.78-1.42L8.414 12l1.466-.69-.78-1.419 1.59.305.202-1.608L12 9.771l1.108-1.183.202 1.608 1.59-.306-.78 1.42 1.465.689z"
            fill="#FFDA44"
          />
        </G>
        <Defs>
          <ClipPath id="AR_svg__a">
            <Path fill="#fff" d="M0 0h24v24H0z" />
          </ClipPath>
        </Defs>
      </Svg>
    ),
  },
  {
    locale: 'en' as const,
    label: 'English',
    flag: (
      <Svg width={28} height={28} fill="none" viewBox="0 0 24 24">
        <G clipPath="url(#US_svg__a)">
          <Path
            d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z"
            fill="#F0F0F0"
          />
          <Path
            d="M11.477 12H24a12.01 12.01 0 00-.413-3.13H11.478V12zm0-6.262h10.761a12.064 12.064 0 00-2.769-3.13h-7.992v3.13zM12 24c2.824 0 5.42-.976 7.47-2.609H4.53A11.948 11.948 0 0012 24zM1.761 18.26h20.477a11.93 11.93 0 001.348-3.13H.413c.3 1.116.758 2.167 1.348 3.13z"
            fill="#D80027"
          />
          <Path
            d="M5.559 1.874h1.093l-1.017.739.389 1.196-1.018-.74-1.017.74.336-1.033c-.896.746-1.68 1.62-2.328 2.594h.35l-.647.47c-.1.168-.197.34-.29.513l.31.951-.578-.419C1 7.19.868 7.5.75 7.817l.34 1.048h1.258l-1.017.74.388 1.195-1.017-.739-.61.443C.033 10.994 0 11.494 0 12h12V0C9.63 0 7.42.688 5.559 1.874zm.465 8.926l-1.018-.739-1.017.739.389-1.196-1.017-.739h1.257l.388-1.195.389 1.195h1.257l-1.017.74.389 1.195zm-.389-4.691l.389 1.195-1.018-.739-1.017.74.389-1.196-1.017-.74h1.257l.388-1.195.389 1.196h1.257l-1.017.739zm4.693 4.691l-1.017-.739-1.017.739.388-1.196-1.017-.739h1.257l.389-1.195.388 1.195h1.258l-1.018.74.389 1.195zm-.389-4.691l.389 1.195-1.017-.739-1.017.74.388-1.196-1.017-.74h1.257l.389-1.195.388 1.196h1.258l-1.018.739zm0-3.496l.389 1.196-1.017-.74-1.017.74.388-1.196-1.017-.739h1.257L9.311.678l.388 1.196h1.258l-1.018.739z"
            fill="#0052B4"
          />
        </G>
        <Defs>
          <ClipPath id="US_svg__a">
            <Path fill="#fff" d="M0 0h24v24H0z" />
          </ClipPath>
        </Defs>
      </Svg>
    ),
  },
];

const STEPS = [
  { icon: 'calendar-outline' as const, key: 'Step1' },
  { icon: 'swap-vertical-outline' as const, key: 'Step2' },
  { icon: 'heart-outline' as const, key: 'Step3' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuth();
  const { t } = useTranslation('auth');

  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [locale, setLocale] = useState<'es' | 'en'>(user?.locale ?? 'es');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    setStep((s) => s + 1);
  };

  const handleComplete = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await apiCompleteOnboarding(displayName.trim(), locale);
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
            {[0, 1, 2].map((i) => (
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

          {step === 2 && (
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
          {step < 2 ? (
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
