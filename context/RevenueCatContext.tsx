import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import Purchases, { LOG_LEVEL, CustomerInfo } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { router } from 'expo-router';
import { useAuth } from './AuthContext';

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
  presentPaywall: () => void;
  presentPaywallIfNeeded: () => void;
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
        if (!configuredRef.current) {
          if (__DEV__) {
            Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
          }
          Purchases.configure({
            apiKey: process.env.EXPO_PUBLIC_RC_API_KEY!,
          });
          configuredRef.current = true;
        }

        const { customerInfo } = await Purchases.logIn(user!.userId);
        updateFromCustomerInfo(customerInfo);
        await fetchEntitlementData();
      } catch (e) {
        console.warn('RevenueCat init failed:', e);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [user, token, fetchEntitlementData]);

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

  const presentPaywall = useCallback(() => {
    router.push('/paywall');
  }, []);

  const presentPaywallIfNeeded = useCallback(() => {
    if (checkEntitlement(customerInfo)) return;
    router.push('/paywall');
  }, [customerInfo]);

  const presentCustomerCenter = useCallback(async (): Promise<void> => {
    await RevenueCatUI.presentCustomerCenter();
  }, []);

  const restorePurchases = useCallback(async (): Promise<CustomerInfo> => {
    const info = await Purchases.restorePurchases();
    updateFromCustomerInfo(info);
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
