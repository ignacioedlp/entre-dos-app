import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Linking,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Purchases, {
  PurchasesPackage,
  PurchasesOffering,
} from "react-native-purchases";
import { Ionicons } from "@expo/vector-icons";
import { Toast } from "toastify-react-native";

import { Colors } from "../constants/colors";
import { useRevenueCat } from "../context/RevenueCatContext";

type PlanType = "ANNUAL" | "MONTHLY";

const TERMS_URL = "https://entredos.app/terms";
const PRIVACY_URL = "https://entredos.app/privacy";

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation("home");
  const { restorePurchases } = useRevenueCat();

  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("ANNUAL");
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
        // Default to annual if available, otherwise monthly
        if (!offerings.current.annual && offerings.current.monthly) {
          setSelectedPlan("MONTHLY");
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

  const selectedPkg: PurchasesPackage | null =
    selectedPlan === "ANNUAL" ? annualPkg : monthlyPkg;

  // Calculate annual savings percentage
  const savingsPercent =
    monthlyPkg && annualPkg
      ? Math.round(
          100 - (annualPkg.product.price / (monthlyPkg.product.price * 12)) * 100
        )
      : null;

  async function handlePurchase() {
    if (!selectedPkg || purchasing) return;
    setPurchasing(true);
    try {
      await Purchases.purchasePackage(selectedPkg);
      router.back();
    } catch (e: any) {
      if (!e.userCancelled) {
        Toast.error(t("packs.restoreError"));
      }
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    try {
      await restorePurchases();
      Toast.success(t("packs.restoreSuccess"));
      router.back();
    } catch {
      Toast.error(t("packs.restoreError"));
    }
  }

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={Colors.accent} size="large" />
        <Text style={styles.loadingText}>{t("paywall.loading")}</Text>
      </View>
    );
  }

  // ── Error ──────────────────────────────────────────────────────
  if (error || !offering) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Text style={styles.errorText}>{t("paywall.error")}</Text>
        <Pressable style={styles.retryButton} onPress={fetchOfferings}>
          <Text style={styles.retryButtonText}>{t("paywall.retry")}</Text>
        </Pressable>
      </View>
    );
  }

  // ── Main ───────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t("paywall.title")}</Text>
        <Text style={styles.subtitle}>{t("paywall.subtitle")}</Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        {(["feature1", "feature2", "feature3"] as const).map((key) => (
          <View key={key} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
            <Text style={styles.featureText}>{t(`paywall.${key}`)}</Text>
          </View>
        ))}
      </View>

      {/* Plan selector */}
      <View style={styles.plans}>
        {annualPkg && (
          <PlanCard
            label={t("paywall.annual")}
            priceString={annualPkg.product.priceString}
            perMonthString={annualPkg.product.pricePerMonthString}
            perMonthLabel={t("paywall.perMonth")}
            badge={
              savingsPercent && savingsPercent > 0
                ? t("paywall.savePercent", { percent: savingsPercent })
                : t("paywall.bestValue")
            }
            selected={selectedPlan === "ANNUAL"}
            onPress={() => setSelectedPlan("ANNUAL")}
          />
        )}
        {monthlyPkg && (
          <PlanCard
            label={t("paywall.monthly")}
            priceString={monthlyPkg.product.priceString}
            perMonthString={null}
            perMonthLabel={t("paywall.perMonth")}
            badge={null}
            selected={selectedPlan === "MONTHLY"}
            onPress={() => setSelectedPlan("MONTHLY")}
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
          <Text style={styles.ctaText}>{t("paywall.subscribe")}</Text>
        )}
      </Pressable>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable onPress={handleRestore}>
          <Text style={styles.footerLink}>{t("paywall.restore")}</Text>
        </Pressable>
        <View style={styles.footerDivider} />
        <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
          <Text style={styles.footerLink}>{t("paywall.terms")}</Text>
        </Pressable>
        <View style={styles.footerDivider} />
        <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
          <Text style={styles.footerLink}>{t("paywall.privacy")}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ── Plan Card ────────────────────────────────────────────────────

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
    <Pressable
      onPress={onPress}
      style={[styles.planCard, selected && styles.planCardSelected]}
    >
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Text style={[styles.planLabel, selected && styles.planLabelSelected]}>
        {label}
      </Text>
      <Text style={[styles.planPrice, selected && styles.planPriceSelected]}>
        {priceString}
      </Text>
      {perMonthString && (
        <Text style={styles.planPerMonth}>
          {perMonthString}
          {perMonthLabel}
        </Text>
      )}
    </Pressable>
  );
}

// ── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },

  // Loading
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 12,
  },

  // Error
  errorText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  retryButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Header
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontFamily: "Inter_900Black",
    fontSize: 32,
    letterSpacing: -1,
    color: Colors.accent,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 12,
    textShadowColor: Colors.glowPasion,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
    textAlign: "center",
    maxWidth: 280,
  },

  // Features
  features: {
    gap: 14,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textPrimary,
  },

  // Plans
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
    position: "relative",
    overflow: "hidden",
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
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  badgeText: {
    fontFamily: "Inter_900Black",
    fontSize: 9,
    letterSpacing: 1,
    color: "#ffffff",
    textTransform: "uppercase",
  },
  planLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: Colors.textMuted,
    marginBottom: 4,
  },
  planLabelSelected: {
    color: Colors.textSecondary,
  },
  planPrice: {
    fontFamily: "Inter_900Black",
    fontSize: 28,
    letterSpacing: -0.5,
    color: Colors.textSecondary,
  },
  planPriceSelected: {
    color: Colors.textPrimary,
  },
  planPerMonth: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // CTA
  ctaButton: {
    backgroundColor: Colors.accent,
    borderRadius: 9999,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
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
  ctaText: {
    fontFamily: "Inter_900Black",
    fontSize: 14,
    letterSpacing: 1.5,
    color: "#ffffff",
    textTransform: "uppercase",
  },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  footerLink: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  footerDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
    opacity: 0.5,
  },
});
