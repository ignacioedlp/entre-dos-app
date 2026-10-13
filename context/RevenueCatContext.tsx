import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Purchases, {
  LOG_LEVEL,
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { useAuth } from './AuthContext';
import { trackError, trackEvent } from '@/lib/analytics';

const ENTITLEMENT_ID = 'Passion';

interface EntitlementData {
  premium: boolean;
  source: string | null;
  ownerUserId: string | null;
  isPurchaser: boolean;
  plan: string | null;
  status: string | null;
  expiresAt: string | null;
  entitlement: string | null;
}

interface RevenueCatContextValue {
  isSubscribed: boolean;
  isPurchaser: boolean;
  entitlementData: EntitlementData | null;
  customerInfo: CustomerInfo | null;
  loading: boolean;
  presentPaywall: () => Promise<void>;
  presentPaywallIfNeeded: () => Promise<void>;
  getPaywallOffering: () => Promise<PurchasesOffering>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<CustomerInfo>;
  dismissPaywall: () => void;
  presentCustomerCenter: () => Promise<void>;
  restorePurchases: () => Promise<CustomerInfo>;
}

const RevenueCatContext = createContext<RevenueCatContextValue | undefined>(undefined);

function checkEntitlement(info: CustomerInfo | null): boolean {
  return info?.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export function RevenueCatProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const paywallRequest = useRef<{ promise: Promise<void>; resolve: () => void } | null>(null);
  const configuredRef = useRef(false);
  const configuringRef = useRef<Promise<void> | null>(null);
  const [configured, setConfigured] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPurchaser, setIsPurchaser] = useState(false);
  const [entitlementData, setEntitlementData] = useState<EntitlementData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch entitlement data from the API
  const fetchEntitlementData = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/subscriptions/entitlements`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data: EntitlementData = await response.json();
        setEntitlementData(data);
        setIsPurchaser(data.isPurchaser);
      }
    } catch (e) {
      console.warn('Failed to fetch entitlement data:', e);
    }
  }, [token]);

  // Update subscription state whenever customerInfo changes
  function updateFromCustomerInfo(info: CustomerInfo) {
    setCustomerInfo(info);
    setIsSubscribed(checkEntitlement(info));
  }

  const ensureRevenueCatReady = useCallback(async () => {
    if (configuringRef.current) return configuringRef.current;
    if (configuredRef.current) return;

    const keyName = Platform.select({
      android: 'EXPO_PUBLIC_RC_API_KEY_ANDROID',
      ios: 'EXPO_PUBLIC_RC_API_IOS_KEY',
      default: 'EXPO_PUBLIC_RC_API_KEY',
    });

    const apiKey =
      Platform.select({
        android: process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID,
        ios: process.env.EXPO_PUBLIC_RC_API_IOS_KEY,
        default: process.env.EXPO_PUBLIC_RC_API_KEY,
      }) ?? process.env.EXPO_PUBLIC_RC_API_KEY;

    if (!apiKey) {
      trackEvent('subscription_configuration_missing', { platform: Platform.OS });
      throw new Error(`Missing ${keyName}`);
    }

    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    }

    const initialization = (async () => {
      Purchases.configure({ apiKey });
      if (user?.userId) {
        const { customerInfo } = await Purchases.logIn(user.userId);
        updateFromCustomerInfo(customerInfo);
      }
      configuredRef.current = true;
      setConfigured(true);
    })();
    configuringRef.current = initialization;
    try {
      await initialization;
    } finally {
      configuringRef.current = null;
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      if (configuredRef.current) {
        Purchases.logOut().catch(() => {});
      }
      setCustomerInfo(null);
      setIsSubscribed(false);
      setIsPurchaser(false);
      setEntitlementData(null);
      setLoading(false);
      return;
    }

    async function init() {
      if (process.env.EXPO_PUBLIC_PURCHASES_ENABLED === 'false') {
        setLoading(false);
        return;
      }

      try {
        await ensureRevenueCatReady();
        await fetchEntitlementData();
      } catch (e) {
        trackError(e, { area: 'subscriptions', flow: 'init', platform: Platform.OS });
        console.warn('RevenueCat init failed:', e);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [user, token, fetchEntitlementData, ensureRevenueCatReady]);

  // Listen for real-time subscription changes
  useEffect(() => {
    if (!configured) return;

    const listener = (info: CustomerInfo) => {
      updateFromCustomerInfo(info);
    };
    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [configured, user]);

  // Own the purchase UI so missing/unsupported remote templates cannot show
  // RevenueCat's generic paywall without subscription benefits.
  const presentPaywall = useCallback((): Promise<void> => {
    if (paywallRequest.current) return paywallRequest.current.promise;
    let resolve!: () => void;
    const promise = new Promise<void>((done) => {
      resolve = done;
    });
    paywallRequest.current = { promise, resolve };
    trackEvent('paywall_opened', { source: 'direct' });
    router.push('/paywall');
    return promise;
  }, [router]);

  const dismissPaywall = useCallback(() => {
    paywallRequest.current?.resolve();
    paywallRequest.current = null;
  }, []);

  const presentPaywallIfNeeded = useCallback(async (): Promise<void> => {
    await ensureRevenueCatReady();
    const info = await Purchases.getCustomerInfo();
    updateFromCustomerInfo(info);
    if (!checkEntitlement(info)) await presentPaywall();
  }, [ensureRevenueCatReady, presentPaywall]);

  const getPaywallOffering = useCallback(async (): Promise<PurchasesOffering> => {
    await ensureRevenueCatReady();
    const offerings = await Purchases.getOfferings();
    const identifier = process.env.EXPO_PUBLIC_RC_OFFERING_ID;
    const offering = identifier ? offerings.all[identifier] : offerings.current;
    if (!offering || (!offering.annual && !offering.monthly)) {
      throw new Error('No monthly or annual subscription offering available');
    }
    trackEvent('paywall_offering_loaded', { offering_id: offering.identifier });
    return offering;
  }, [ensureRevenueCatReady]);

  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage): Promise<CustomerInfo> => {
      await ensureRevenueCatReady();
      const { customerInfo: info } = await Purchases.purchasePackage(pkg);
      updateFromCustomerInfo(info);
      await fetchEntitlementData();
      trackEvent('subscription_purchased', { product_id: pkg.product.identifier });
      return info;
    },
    [ensureRevenueCatReady, fetchEntitlementData]
  );

  const presentCustomerCenter = useCallback(async (): Promise<void> => {
    await RevenueCatUI.presentCustomerCenter();
  }, []);

  const restorePurchases = useCallback(async (): Promise<CustomerInfo> => {
    await ensureRevenueCatReady();
    const info = await Purchases.restorePurchases();
    await fetchEntitlementData();
    updateFromCustomerInfo(info);
    trackEvent('purchases_restored', { has_entitlement: checkEntitlement(info) });
    return info;
  }, [ensureRevenueCatReady, fetchEntitlementData]);

  return (
    <RevenueCatContext.Provider
      value={{
        isSubscribed,
        isPurchaser,
        entitlementData,
        customerInfo,
        loading,
        presentPaywall,
        presentPaywallIfNeeded,
        getPaywallOffering,
        purchasePackage,
        dismissPaywall,
        presentCustomerCenter,
        restorePurchases,
      }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
}

export function useRevenueCat(): RevenueCatContextValue {
  const ctx = useContext(RevenueCatContext);
  if (!ctx) throw new Error('useRevenueCat must be used within RevenueCatProvider');
  return ctx;
}
