import * as Notifications from "expo-notifications";
import { useCallback, useState } from "react";
import { Alert, Linking, Platform } from "react-native";

import {
  getExpoPushToken,
} from "@/lib/notifications";
import { storage } from "@/lib/storage";
import { registerPushToken, unregisterPushNotifications } from "@/lib/api";

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
      // On iOS, once denied the OS won't re-prompt — direct user to Settings
      if (Platform.OS === "ios") {
        Alert.alert(
          "Notifications Disabled",
          "To receive notifications, please enable them in your device Settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
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