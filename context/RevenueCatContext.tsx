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
import Purchases, { LOG_LEVEL, CustomerInfo } from 'react-native-purchases';
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
  presentCustomerCenter: () => Promise<void>;
  restorePurchases: () => Promise<CustomerInfo>;
}

const RevenueCatContext = createContext<RevenueCatContextValue | undefined>(undefined);

function checkEntitlement(info: CustomerInfo | null): boolean {
  return info?.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export function RevenueCatProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const configuredRef = useRef(false);
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

    Purchases.configure({ apiKey });

    if (user?.userId) {
      const { customerInfo } = await Purchases.logIn(user.userId);
      updateFromCustomerInfo(customerInfo);
    }

    configuredRef.current = true;
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
    if (!configuredRef.current) return;

    const listener = (info: CustomerInfo) => {
      updateFromCustomerInfo(info);
    };
    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [user]);

  const presentPaywall = useCallback(async (): Promise<void> => {
    await ensureRevenueCatReady();
    trackEvent('paywall_opened', { source: 'direct' });

    try {
      await RevenueCatUI.presentPaywall({
        displayCloseButton: true,
      });
    } catch (e) {
      trackError(e, { area: 'subscriptions', flow: 'presentPaywall', platform: Platform.OS });
      throw e;
    }
  }, [ensureRevenueCatReady]);

  const presentPaywallIfNeeded = useCallback(async (): Promise<void> => {
    try {
      await ensureRevenueCatReady();
      trackEvent('paywall_opened', { source: 'required_entitlement' });

      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_ID,
        displayCloseButton: true,
      });

      if (result === RevenueCatUI.PAYWALL_RESULT.NOT_PRESENTED) {
        trackEvent('paywall_not_presented', { has_customer_info: customerInfo != null });

        await RevenueCatUI.presentPaywall({
          displayCloseButton: true,
        });
      }

      if (result === RevenueCatUI.PAYWALL_RESULT.ERROR) {
        trackEvent('paywall_result', { result: 'error' });
      }
    } catch (e) {
      trackError(e, { area: 'subscriptions', flow: 'presentPaywallIfNeeded' });

      console.warn('RevenueCat presentPaywallIfNeeded failed, falling back to presentPaywall:', e);
      try {
        await RevenueCatUI.presentPaywall({
          displayCloseButton: true,
        });
      } catch (fallbackError) {
        trackError(fallbackError, { area: 'subscriptions', flow: 'presentPaywallFallback' });
        throw fallbackError;
      }
    }
  }, [customerInfo, ensureRevenueCatReady]);

  const presentCustomerCenter = useCallback(async (): Promise<void> => {
    await RevenueCatUI.presentCustomerCenter();
  }, []);

  const restorePurchases = useCallback(async (): Promise<CustomerInfo> => {
    const info = await Purchases.restorePurchases();
    updateFromCustomerInfo(info);
    trackEvent('purchases_restored', { has_entitlement: checkEntitlement(info) });
    return info;
  }, []);

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
