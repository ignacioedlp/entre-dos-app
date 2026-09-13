import { AdEventType, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';

export interface RewardedAdRequest {
  adUnitId: string;
  userId: string;
  customData: string;
}

export function showRewardedAd(request: RewardedAdRequest) {
  return new Promise<void>((resolve, reject) => {
    const ad = RewardedAd.createForAdRequest(request.adUnitId, {
      requestNonPersonalizedAdsOnly: true,
      serverSideVerificationOptions: {
        userId: request.userId,
        customData: request.customData,
      },
    });
    let earned = false;
    let settled = false;
    let loadTimeout: ReturnType<typeof setTimeout>;
    const subscriptions: (() => void)[] = [];
    const cleanup = () => {
      clearTimeout(loadTimeout);
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    subscriptions.push(
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        clearTimeout(loadTimeout);
        if (__DEV__) console.info('[ads] Rewarded ad loaded');
        void ad.show().catch(fail);
      }),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        if (__DEV__) console.info('[ads] Client earned rewarded ad');
        earned = true;
        settled = true;
        cleanup();
        resolve();
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        if (__DEV__) console.info(`[ads] Rewarded ad closed; earned=${earned}`);
        if (!earned && !settled) fail(new Error('rewarded-ad-closed'));
      }),
      ad.addAdEventListener(AdEventType.ERROR, (error) => {
        if (!settled) fail(error);
      })
    );
    loadTimeout = setTimeout(() => fail(new Error('rewarded-ad-load-timeout')), 20_000);
    ad.load();
  });
}

export function rewardedAdErrorDiagnostics(error: unknown) {
  if (!(error instanceof Error)) return { message: String(error) };
  const nativeError = error as Error & { code?: unknown };
  return {
    name: nativeError.name,
    message: nativeError.message,
    code: typeof nativeError.code === 'string' ? nativeError.code : undefined,
  };
}
