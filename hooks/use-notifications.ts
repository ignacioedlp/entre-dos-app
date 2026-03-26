import * as Notifications from "expo-notifications";
import { useCallback, useState } from "react";
import { Alert, Linking, Platform } from "react-native";

import {
  getExpoPushToken,
} from "@/lib/notifications";
import { storage } from "@/lib/storage";
import { registerPushToken, unregisterPushNotifications } from "@/lib/api";
import i18n from "@/i18n";

const NOTIFICATIONS_ENABLED_KEY = "notifications_enabled";
const NOTIFICATIONS_PROMPTED_KEY = "notifications_prompted";

export function useNotifications() {
  const [isEnabled, setIsEnabled] = useState(
    () => storage.getBoolean(NOTIFICATIONS_ENABLED_KEY) ?? false,
  );
  const [hasBeenPrompted, setHasBeenPrompted] = useState(
    () => storage.getBoolean(NOTIFICATIONS_PROMPTED_KEY) ?? false,
  );

  const enable = useCallback(async (): Promise<boolean> => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      if (Platform.OS === "ios") {
        Alert.alert(
          i18n.t("notifications:alert.disabledTitle"),
          i18n.t("notifications:alert.disabledMessage"),
          [
            { text: i18n.t("notifications:alert.cancel"), style: "cancel" },
            {
              text: i18n.t("notifications:alert.openSettings"),
              onPress: () => Linking.openSettings(),
            },
          ],
        );
      }
      storage.set(NOTIFICATIONS_PROMPTED_KEY, true);
      setHasBeenPrompted(true);
      return false;
    }

    const token = await getExpoPushToken();
    if (token) {
      await registerPushToken(token);
    }

    storage.set(NOTIFICATIONS_ENABLED_KEY, true);
    storage.set(NOTIFICATIONS_PROMPTED_KEY, true);
    setIsEnabled(true);
    setHasBeenPrompted(true);
    return true;
  }, []);

  const disable = useCallback(async () => {
    try {
      await unregisterPushNotifications();
    } catch {
      // Silently fail — still disable locally
    }
    storage.set(NOTIFICATIONS_ENABLED_KEY, false);
    setIsEnabled(false);
  }, []);

  const markAsPrompted = useCallback(() => {
    storage.set(NOTIFICATIONS_PROMPTED_KEY, true);
    setHasBeenPrompted(true);
  }, []);

  return { isEnabled, hasBeenPrompted, enable, disable, markAsPrompted };
}
