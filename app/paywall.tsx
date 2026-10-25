import { AmbientLights } from '@/components/ui/AmbientLights';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { darkColors as colors } from '@/constants/colors';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { Typography } from '@/components/ui/Typography';
import { trackError } from '@/lib/analytics';

const hasPassion = (info: CustomerInfo) => info.entitlements.active.Passion !== undefined;

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation('home');
  const { getPaywallOffering, purchasePackage, restorePurchases, dismissPaywall } = useRevenueCat();
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const mounted = useRef(false);
  const operation = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      dismissPaywall();
    };
  }, [dismissPaywall]);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const plans = await getPaywallOffering();
      if (mounted.current) {
        setOffering(plans);
        setSelected(plans.annual ?? plans.monthly);
      }
    } catch (error) {
      trackError(error, { area: 'subscriptions', flow: 'loadPaywallOffering' });
      if (mounted.current) setMessage('error');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [getPaywallOffering]);
  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  function close() {
    if (operation.current) return;
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  async function transact(restore: boolean) {
    if (operation.current || (!restore && !selected)) return;
    operation.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const info = restore ? await restorePurchases() : await purchasePackage(selected!);
      if (mounted.current) {
        if (hasPassion(info)) {
          operation.current = false;
          close();
        } else setMessage(restore ? 'nothingToRestore' : 'pending');
      }
    } catch (error) {
      if (!(
        error &&
        typeof error === 'object' &&
        'userCancelled' in error &&
        error.userCancelled
      )) {
        trackError(error, {
          area: 'subscriptions',
          flow: restore ? 'restorePaywall' : 'purchasePaywall',
        });
        if (mounted.current) setMessage(restore ? 'restoreError' : 'purchaseError');
      }
    } finally {
      operation.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function openLegal(path: 'terms' | 'privacy') {
    try {
      const prefix = i18n.language.startsWith('es') ? '' : '/en';
      await Linking.openURL(`https://entredos.app${prefix}/${path}`);
    } catch {
      if (mounted.current) setMessage('linkError');
    }
  }
  const plans = [offering?.annual, offering?.monthly].filter(
    (pkg): pkg is PurchasesPackage => !!pkg
  );

  return (
    <View style={styles.root}>
      <AmbientLights />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
        ]}
      >
        <View style={styles.topBar}>
          <Ionicons name="heart-outline" size={40} color={colors.accent} accessible={false} />
          <Pressable
            testID="paywall-close"
            accessibilityRole="button"
            accessibilityLabel={t('paywall.close')}
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={close}
            style={styles.close}
          >
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.hero}>
          <Typography
            variant="heading"
            color={colors.textPrimary}
            baseFontSize={32}
            style={styles.center}
          >
            {t('paywall.title')}
          </Typography>
          <Typography color={colors.textPrimary} style={styles.subtitle}>
            {t('paywall.subtitle')}
          </Typography>
          <View style={styles.features}>
            {['feature1', 'feature2', 'feature3', 'feature4'].map((key) => (
              <View key={key} style={styles.feature}>
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.accent}
                  accessible={false}
                />
                <Typography color={colors.textPrimary} style={styles.featureText}>
                  {t(`paywall.${key}`)}
                </Typography>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.purchase}>
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.accent} />
              <Typography color={colors.textPrimary}>{t('paywall.loading')}</Typography>
            </View>
          ) : (
            plans.map((pkg) => {
              const annual = pkg === offering?.annual;
              const active = pkg.identifier === selected?.identifier;
              return (
                <Pressable
                  key={pkg.identifier}
                  testID={annual ? 'paywall-annual' : 'paywall-monthly'}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active, disabled: busy }}
                  disabled={busy}
                  onPress={() => setSelected(pkg)}
                  style={[styles.plan, active && styles.selected]}
                >
                  <Ionicons
                    name={active ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={active ? colors.accent : '#C8C8CC'}
                    accessible={false}
                  />
                  <View style={styles.planBody}>
                    <View style={styles.planRow}>
                      <Typography variant="bodyBold" color={colors.textPrimary} baseFontSize={20}>
                        {t(annual ? 'paywall.annual' : 'paywall.monthly')}
                      </Typography>
                      <Typography variant="bodyBold" color={colors.textPrimary}>
                        {t(annual ? 'paywall.annualPrice' : 'paywall.monthlyPrice', {
                          price: pkg.product.priceString,
                        })}
                      </Typography>
                    </View>
                    {annual && pkg.product.pricePerMonthString && (
                      <Typography color={colors.textPrimary} baseFontSize={14} baseLineHeight={20}>
                        {t('paywall.annualEquivalent', { price: pkg.product.pricePerMonthString })}
                      </Typography>
                    )}
                  </View>
                </Pressable>
              );
            })
          )}
          {message && (
            <Typography
              accessibilityLiveRegion="polite"
              color={colors.textPrimary}
              style={styles.message}
            >
              {t(`paywall.${message}`)}
            </Typography>
          )}
          {!loading && !offering && (
            <Pressable
              accessibilityRole="button"
              onPress={() => void loadPlans()}
              style={styles.retry}
            >
              <Typography variant="button" color={colors.textPrimary}>
                {t('paywall.retry')}
              </Typography>
            </Pressable>
          )}
          <Typography color="#D6D6DA" baseFontSize={12} baseLineHeight={18} style={styles.renewal}>
            {t('paywall.renewal')}
          </Typography>
          <Pressable
            testID="paywall-subscribe"
            accessibilityRole="button"
            accessibilityState={{ disabled: !selected || busy || loading, busy }}
            disabled={!selected || busy || loading}
            onPress={() => void transact(false)}
            style={[styles.subscribe, (!selected || busy || loading) && styles.disabled]}
          >
            {busy ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Typography variant="button" color={colors.textPrimary}>
                {t('paywall.subscribe')}
              </Typography>
            )}
          </Pressable>
          <View style={styles.links}>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => void transact(true)}
              style={styles.link}
            >
              <Typography variant="bodyBold" color="#D6D6DA" baseFontSize={13}>
                {t('paywall.restore')}
              </Typography>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              onPress={() => void openLegal('terms')}
              style={styles.link}
            >
              <Typography variant="bodyBold" color="#D6D6DA" baseFontSize={13}>
                {t('paywall.terms')}
              </Typography>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              onPress={() => void openLegal('privacy')}
              style={styles.link}
            >
              <Typography variant="bodyBold" color="#D6D6DA" baseFontSize={13}>
                {t('paywall.privacy')}
              </Typography>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  hero: { paddingTop: 40, paddingBottom: 36 },
  center: { textAlign: 'center' },
  subtitle: { textAlign: 'center', marginTop: 20 },
  features: { gap: 12, marginTop: 28 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { flex: 1 },
  purchase: { marginTop: 'auto', gap: 10 },
  loading: { gap: 12, alignItems: 'center', paddingVertical: 24 },
  plan: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#262729',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: { borderColor: colors.accent },
  planBody: { flex: 1, gap: 4 },
  planRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  message: { textAlign: 'center', paddingVertical: 8 },
  retry: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  renewal: { textAlign: 'center', marginTop: 12, marginBottom: 4 },
  subscribe: {
    minHeight: 54,
    padding: 16,
    borderRadius: 100,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.55 },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  link: { minHeight: 44, paddingHorizontal: 4, justifyContent: 'center' },
});
