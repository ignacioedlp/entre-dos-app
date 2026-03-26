import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/AuthContext";
import { apiUpdateDisplayName, apiGetHistory } from "@/lib/api";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation("settings");
  const { user, updateProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState("");

  const mutation = useMutation({
    mutationFn: apiUpdateDisplayName,
    onSuccess: (updatedProfile) => {
      updateProfile(updatedProfile);
      setEditing(false);
    },
  });

  function startEditing() {
    setNameValue(user?.displayName ?? "");
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  function handleSave() {
    const trimmed = nameValue.trim();
    if (!trimmed) return;
    mutation.mutate(trimmed);
  }

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 20 }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("profile.title")}</Text>
        <Pressable onPress={() => router.push("/settings")}>
          <Ionicons
            name="settings-outline"
            size={24}
            color={Colors.textPrimary}
          />
        </Pressable>
      </View>

      {/* Display Name Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t("profile.displayName")}</Text>

        {!editing ? (
          <View style={styles.card}>
            <View style={styles.nameRow}>
              <Ionicons name="person" size={22} color={Colors.accent} />
              <Text style={styles.nameText} numberOfLines={1}>
                {user?.displayName || t("profile.namePlaceholder")}
              </Text>
            </View>
            <Pressable onPress={startEditing} style={styles.editBtn}>
              <Ionicons name="pencil" size={18} color={Colors.textSecondary} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.nameInput}
              value={nameValue}
              onChangeText={setNameValue}
              placeholder={t("profile.namePlaceholder")}
              placeholderTextColor={Colors.textMuted}
              autoFocus
              maxLength={30}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            <Pressable
              onPress={handleSave}
              disabled={mutation.isPending || !nameValue.trim()}
              style={({ pressed }) => [
                styles.saveBtn,
                pressed && { opacity: 0.8 },
                (mutation.isPending || !nameValue.trim()) && { opacity: 0.5 },
              ]}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>{t("profile.save")}</Text>
              )}
            </Pressable>

            <Pressable onPress={cancelEditing} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>{t("profile.cancel")}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: "Inter_900Black",
    fontSize: 28,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },

  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 1,
    color: Colors.textMuted,
    textTransform: "uppercase",
    marginBottom: 16,
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Name display
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  nameText: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  editBtnText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Edit mode
  editContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    gap: 16,
  },
  nameInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#ffffff",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 4,
  },
  cancelBtnText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Stats
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  statIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 59, 92, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  statNumber: {
    fontFamily: "Inter_900Black",
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  statCaption: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
