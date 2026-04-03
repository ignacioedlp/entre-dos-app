import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Linking,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Purchases, { PurchasesPackage, PurchasesOffering } from 'react-native-purchases';
import { Ionicons } from '@expo/vector-icons';
import { Toast } from 'toastify-react-native';

import { Colors } from '../constants/colors';
import { useRevenueCat } from '../context/RevenueCatContext';
import { Typography } from '../components/ui/Typography';

type PlanType = 'ANNUAL' | 'MONTHLY';

const TERMS_URL = 'https://entredos.app/terms';
const PRIVACY_URL = 'https://entredos.app/privacy';

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('home');
  const { restorePurchases } = useRevenueCat();

  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('ANNUAL');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchOfferings();
  }, []);

  async function fetchOfferings() {
    setLoading(true);
    setError(false);
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setOffering(offerings.current);
        if (!offerings.current.annual && offerings.current.monthly) {
          setSelectedPlan('MONTHLY');
        }
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const monthlyPkg = offering?.monthly ?? null;
  const annualPkg = offering?.annual ?? null;

  const selectedPkg: PurchasesPackage | null = selectedPlan === 'ANNUAL' ? annualPkg : monthlyPkg;

  const savingsPercent =
    monthlyPkg && annualPkg
      ? Math.round(100 - (annualPkg.product.price / (monthlyPkg.product.price * 12)) * 100)
      : null;

  async function handlePurchase() {
    if (!selectedPkg || purchasing) return;
    setPurchasing(true);
    try {
      await Purchases.purchasePackage(selectedPkg);
      router.back();
    } catch (e: any) {
      if (!e.userCancelled) {
        Toast.error(t('packs.restoreError'));
      }
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    try {
      await restorePurchases();
      Toast.success(t('packs.restoreSuccess'));
      router.back();
    } catch {
      Toast.error(t('packs.restoreError'));
    }
  }

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={Colors.accent} size="large" />
        <Typography variant="body" baseFontSize={14} color={Colors.textMuted} style={styles.loadingText}>
          {t('paywall.loading')}
        </Typography>
      </View>
    );
  }

  if (error || !offering) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Typography variant="bodyBold" color={Colors.textSecondary} style={styles.errorText}>
          {t('paywall.error')}
        </Typography>
        <Pressable style={styles.retryButton} onPress={fetchOfferings}>
          <Typography variant="bodyBold" baseFontSize={14} color={Colors.textSecondary}>
            {t('paywall.retry')}
          </Typography>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="swissTitle" baseFontSize={32} color={Colors.accent} style={styles.title}>
          {t('paywall.title')}
        </Typography>
        <Typography variant="body" baseFontSize={15} baseLineHeight={22} color={Colors.textSecondary} style={styles.subtitle}>
          {t('paywall.subtitle')}
        </Typography>
      </View>

      {/* Features */}
      <View style={styles.features}>
        {(['feature1', 'feature2', 'feature3'] as const).map((key) => (
          <View key={key} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
            <Typography variant="body" baseFontSize={15}>
              {t(`paywall.${key}`)}
            </Typography>
          </View>
        ))}
      </View>

      {/* Plan selector */}
      <View style={styles.plans}>
        {annualPkg && (
          <PlanCard
            label={t('paywall.annual')}
            priceString={annualPkg.product.priceString}
            perMonthString={annualPkg.product.pricePerMonthString}
            perMonthLabel={t('paywall.perMonth')}
            badge={
              savingsPercent && savingsPercent > 0
                ? t('paywall.savePercent', { percent: savingsPercent })
                : t('paywall.bestValue')
            }
            selected={selectedPlan === 'ANNUAL'}
            onPress={() => setSelectedPlan('ANNUAL')}
          />
        )}
        {monthlyPkg && (
          <PlanCard
            label={t('paywall.monthly')}
            priceString={monthlyPkg.product.priceString}
            perMonthString={null}
            perMonthLabel={t('paywall.perMonth')}
            badge={null}
            selected={selectedPlan === 'MONTHLY'}
            onPress={() => setSelectedPlan('MONTHLY')}
          />
        )}
      </View>

      {/* CTA */}
      <Pressable
        onPress={handlePurchase}
        disabled={purchasing || !selectedPkg}
        style={({ pressed }) => [
          styles.ctaButton,
          pressed && styles.ctaPressed,
          (purchasing || !selectedPkg) && styles.ctaDisabled,
        ]}
      >
        {purchasing ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Typography variant="cardLabel" color="#ffffff" style={{ opacity: 1, letterSpacing: 1.5, fontSize: 14 }}>
            {t('paywall.subscribe')}
          </Typography>
        )}
      </Pressable>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable onPress={handleRestore}>
          <Typography variant="caption" color={Colors.textMuted}>
            {t('paywall.restore')}
          </Typography>
        </Pressable>
        <View style={styles.footerDivider} />
        <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
          <Typography variant="caption" color={Colors.textMuted}>
            {t('paywall.terms')}
          </Typography>
        </Pressable>
        <View style={styles.footerDivider} />
        <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
          <Typography variant="caption" color={Colors.textMuted}>
            {t('paywall.privacy')}
          </Typography>
        </Pressable>
      </View>
    </ScrollView>
  );
}

interface PlanCardProps {
  label: string;
  priceString: string;
  perMonthString: string | null;
  perMonthLabel: string;
  badge: string | null;
  selected: boolean;
  onPress: () => void;
}

function PlanCard({
  label,
  priceString,
  perMonthString,
  perMonthLabel,
  badge,
  selected,
  onPress,
}: PlanCardProps) {
  return (
    <Pressable onPress={onPress} style={[styles.planCard, selected && styles.planCardSelected]}>
      {badge && (
        <View style={styles.badge}>
          <Typography variant="cardLabel" color="#ffffff" baseFontSize={9} style={{ opacity: 1, letterSpacing: 1 }}>
            {badge}
          </Typography>
        </View>
      )}
      <Typography
        variant="label"
        color={selected ? Colors.textSecondary : Colors.textMuted}
        style={styles.planLabel}
      >
        {label}
      </Typography>
      <Typography
        variant="heading"
        baseFontSize={28}
        color={selected ? Colors.textPrimary : Colors.textSecondary}
        style={styles.planPrice}
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {priceString}
      </Typography>
      {perMonthString && (
        <Typography variant="body" baseFontSize={13} color={Colors.textMuted} style={styles.planPerMonth}>
          {perMonthString}
          {perMonthLabel}
        </Typography>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  loadingText: {
    marginTop: 12,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -1,
    textShadowColor: Colors.glowPasion,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 280,
  },
  features: {
    gap: 14,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  plans: {
    gap: 12,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  planLabel: {
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  planPrice: {
    letterSpacing: -0.5,
  },
  planPerMonth: {
    marginTop: 2,
  },
  ctaButton: {
    backgroundColor: Colors.accent,
    borderRadius: 9999,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 24,
  },
  ctaPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  footerDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
    opacity: 0.5,
  },
});
