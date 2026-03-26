import { useEffect, useRef, useState } from "react";
import { Modal, View, Text, StyleSheet, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

export function NotificationSetup() {
  const { user } = useAuth();
  const { hasBeenPrompted, enable, markAsPrompted } = useNotifications();
  const promptedRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation("notifications");

  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#D4AF37",
      });
    }
  }, []);

  useEffect(() => {
    if (!user || hasBeenPrompted || promptedRef.current) return;
    promptedRef.current = true;
    setVisible(true);
  }, [user, hasBeenPrompted]);

  function handleNotNow() {
    setVisible(false);
    markAsPrompted();
  }

  async function handleEnable() {
    setVisible(false);
    await enable();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={handleNotNow}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="notifications" size={28} color={Colors.pasion} />
          </View>

          <Text style={styles.title}>{t("setup.title")}</Text>
          <Text style={styles.body}>{t("setup.body")}</Text>

          <View style={styles.actions}>
            <Button
              label={t("setup.enable")}
              onPress={handleEnable}
              variant="accent"
            />
            <Button
              label={t("setup.later")}
              onPress={handleNotNow}
              variant="ghost"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,59,92,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: "Inter_900Black",
    fontSize: 20,
    letterSpacing: -0.3,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 10,
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 28,
    maxWidth: 280,
  },
  actions: {
    width: "100%",
    gap: 10,
  },
});
