import PostHog from 'posthog-react-native';

import type { ProfileData } from './storage';

type EventProperties = Record<string, unknown>;

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim() ?? '';
const host = 'https://us.i.posthog.com';

/**
 * Single observability boundary for the mobile app.
 *
 * Keep event properties non-sensitive: never add access tokens, email addresses,
 * card text, messages, photos, or notification content.
 */
export const posthog = new PostHog(apiKey, {
  host,
  enableSessionReplay: !__DEV__,
  sessionReplayConfig: {
    // Replay is useful for diagnosis without exposing what people type or share.
    maskAllTextInputs: true,
    maskAllImages: true,
    maskAllSandboxedViews: true,
    captureLog: true,
  },
  errorTracking: {
    autocapture: {
      uncaughtExceptions: true,
      unhandledRejections: true,
      nativeCrashes: true,
    },
  },
  captureAppLifecycleEvents: true,
});

export function trackEvent(event: string, properties?: EventProperties): void {
  posthog.capture(event, properties as never);
}

export function trackScreen(screenName: string): void {
  posthog.screen(screenName);
}

export function trackError(error: unknown, properties?: EventProperties): void {
  posthog.captureException(error, properties as never);
}

export function identifyUser(profile: ProfileData): void {
  posthog.identify(profile.userId, {
    locale: profile.locale,
    country: profile.country,
    has_partner: Boolean(profile.coupleId),
    onboarding_completed: profile.onboardingCompleted,
    push_notifications_enabled: profile.pushNotifications,
  });
}

export function resetAnalytics(): void {
  posthog.reset();
}
