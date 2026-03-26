import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Colors } from "@/constants/colors";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const { t } = useTranslation("settings");

  const MENU_ITEMS = [
    {
      label: t("menu.notifications"),
      route: "/settings/notifications",
      icon: "notifications-outline",
    },
    {
      label: t("menu.language"),
      route: "/settings/language",
      icon: "language-outline",
    },
    {
      label: t("menu.relationship"),
      route: "/settings/relationship",
      icon: "heart-outline",
    },
    {
      label: t("menu.terms"),
      route: "/settings/terms",
      icon: "document-text-outline",
    },
    {
      label: t("menu.privacy"),
      route: "/settings/privacy",
      icon: "shield-checkmark-outline",
    },
    {
      label: t("menu.faq"),
      route: "/settings/faq",
      icon: "help-circle-outline",
    },
  ] as const;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.background} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("title")}</Text>
      </View>

      <View style={styles.content}>
        <View>
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.route}
              style={styles.row}
              onPress={() => router.push(item.route as any)}
            >
              <Ionicons name={item.icon} size={20} color={Colors.textMuted} />
              <Text style={styles.rowLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Button
            label={t("signOut")}
            onPress={() => setLogoutVisible(true)}
            variant="accent"
          />
        </View>
      </View>

      <Modal
        visible={logoutVisible}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setLogoutVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons
                name="log-out-outline"
                size={28}
                color={Colors.pasion}
              />
            </View>

            <Text style={styles.modalTitle}>{t("signOutConfirmTitle")}</Text>
            <Text style={styles.modalBody}>{t("signOutConfirmMessage")}</Text>

            <View style={styles.actions}>
              <Button
                label={t("signOut")}
                onPress={() => {
                  logout();
                  router.replace("/(auth)/welcome");
                }}
                variant="accent"
              />
              <Button
                label={t("cancel", { ns: "common" })}
                onPress={() => setLogoutVisible(false)}
                variant="ghost"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 20,
    paddingVertical: 14,
    marginBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Inter_900Black",
    fontSize: 28,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  row: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 0.8,
    color: Colors.textMuted,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
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
  modalTitle: {
    fontFamily: "Inter_900Black",
    fontSize: 20,
    letterSpacing: -0.3,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 10,
  },
  modalBody: {
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
