import * as Notifications from 'expo-notifications';
import { useCallback, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { getExpoPushToken } from '@/lib/notifications';
import { storage } from '@/lib/storage';
import { apiGetProfile, registerPushToken, unregisterPushNotifications } from '@/lib/api';
import i18n from '@/i18n';

const NOTIFICATIONS_PROMPTED_KEY = 'notifications_prompted';

export function useNotifications() {
  const { user, updateProfile } = useAuth();
  const isEnabled = user?.pushNotifications ?? false;
  const [hasBeenPrompted, setHasBeenPrompted] = useState(
    () => storage.getBoolean(NOTIFICATIONS_PROMPTED_KEY) ?? false
  );

  const showEnableError = useCallback(() => {
    Alert.alert(
      i18n.t('notifications:alert.enableFailedTitle'),
      i18n.t('notifications:alert.enableFailedMessage')
    );
  }, []);

  const enable = useCallback(async (): Promise<boolean> => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      if (Platform.OS === 'ios') {
        Alert.alert(
          i18n.t('notifications:alert.disabledTitle'),
          i18n.t('notifications:alert.disabledMessage'),
          [
            { text: i18n.t('notifications:alert.cancel'), style: 'cancel' },
            {
              text: i18n.t('notifications:alert.openSettings'),
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }
      storage.set(NOTIFICATIONS_PROMPTED_KEY, true);
      setHasBeenPrompted(true);
      return false;
    }

    const token = await getExpoPushToken();
    if (!token) {
      showEnableError();
      return false;
    }

    try {
      await registerPushToken(token);
    } catch {
      // A request can time out after the API has already stored the token.
      // Confirm the persisted preference before treating the activation as failed.
      try {
        const profile = await apiGetProfile();
        if (profile.pushNotifications) {
          storage.set(NOTIFICATIONS_PROMPTED_KEY, true);
          updateProfile(profile);
          setHasBeenPrompted(true);
          return true;
        }
      } catch {
        // The original request error is the useful outcome if confirmation fails too.
      }

      showEnableError();
      return false;
    }

    storage.set(NOTIFICATIONS_PROMPTED_KEY, true);
    if (user) {
      updateProfile({ ...user, pushNotifications: true });
    }
    setHasBeenPrompted(true);
    return true;
  }, [showEnableError, updateProfile, user]);

  const disable = useCallback(async () => {
    try {
      await unregisterPushNotifications();
    } catch {
      // Silently fail — still disable locally
    }
    if (user) {
      updateProfile({ ...user, pushNotifications: false });
    }
  }, [updateProfile, user]);

  const markAsPrompted = useCallback(() => {
    storage.set(NOTIFICATIONS_PROMPTED_KEY, true);
    setHasBeenPrompted(true);
  }, []);

  return { isEnabled, hasBeenPrompted, enable, disable, markAsPrompted };
}
