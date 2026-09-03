import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import * as Sentry from '@sentry/react-native';
import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';

interface AdsContextValue {
  ready: boolean;
  ensureReady: () => Promise<boolean>;
  showPrivacyOptions: () => Promise<void>;
}

const AdsContext = createContext<AdsContextValue | undefined>(undefined);
let initializationPromise: Promise<boolean> | null = null;

async function initializeAds(): Promise<boolean> {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        const consent = await AdsConsent.gatherConsent();
        if (!consent.canRequestAds) return false;
        await mobileAds().initialize();
        return true;
      } catch (error) {
        Sentry.captureException(error, { tags: { area: 'ads', flow: 'consent-init' } });
        try {
          const consent = await AdsConsent.getConsentInfo();
          if (!consent.canRequestAds) return false;
          await mobileAds().initialize();
          return true;
        } catch {
          return false;
        }
      }
    })();
  }
  return initializationPromise;
}

export function AdsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  const ensureReady = useCallback(async () => {
    const initialized = await initializeAds();
    setReady(initialized);
    return initialized;
  }, []);

  useEffect(() => {
    void ensureReady();
  }, [ensureReady]);

  const showPrivacyOptions = useCallback(async () => {
    await AdsConsent.showPrivacyOptionsForm();
    initializationPromise = null;
    await ensureReady();
  }, [ensureReady]);

  return (
    <AdsContext.Provider value={{ ready, ensureReady, showPrivacyOptions }}>
      {children}
    </AdsContext.Provider>
  );
}

export function useAds() {
  const context = useContext(AdsContext);
  if (!context) throw new Error('useAds must be used within AdsProvider');
  return context;
}
