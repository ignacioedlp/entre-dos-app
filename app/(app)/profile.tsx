import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
  ActionSheetIOS,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useAuth } from "@/context/AuthContext";
import { apiUpdateDisplayName } from "@/lib/api";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation("settings");
  const { user, updateProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState("");

  const {
    pickFromGallery,
    pickFromCamera,
    isPending: avatarPending,
  } = useAvatarUpload();

  function showAvatarOptions() {
    const options = [
      t("profile.camera"),
      t("profile.gallery"),
      t("profile.cancel"),
    ];
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 2 },
        (index) => {
          if (index === 0) pickFromCamera();
          else if (index === 1) pickFromGallery();
        },
      );
    } else {
      Alert.alert(t("profile.changePhoto"), undefined, [
        { text: t("profile.camera"), onPress: pickFromCamera },
        { text: t("profile.gallery"), onPress: pickFromGallery },
        { text: t("profile.cancel"), style: "cancel" },
      ]);
    }
  }

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

      {/* Avatar + Name Section */}
      <View style={styles.avatarSection}>
        <Pressable onPress={showAvatarOptions} disabled={avatarPending}>
          <View style={styles.avatarContainer}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={48} color={Colors.textMuted} />
              </View>
            )}
            {avatarPending && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
            <View style={styles.cameraButton}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </View>
        </Pressable>

        {/* Name below avatar */}
        {!editing ? (
          <Pressable onPress={startEditing} style={styles.nameUnderAvatar}>
            <Text style={styles.nameText} numberOfLines={1}>
              {user?.displayName || t("profile.namePlaceholder")}
            </Text>
            <Ionicons name="pencil" size={16} color={Colors.textSecondary} />
          </Pressable>
        ) : (
          <View style={styles.editContainerInline}>
            <TextInput
              style={styles.nameInputInline}
              value={nameValue}
              onChangeText={setNameValue}
              placeholder={t("profile.namePlaceholder")}
              placeholderTextColor={Colors.textMuted}
              autoFocus
              maxLength={30}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              textAlign="center"
            />
            <View style={styles.editActions}>
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

  // Avatar
  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
    gap: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.background,
  },

  // Name under avatar
  nameUnderAvatar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameText: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.textPrimary,
  },

  // Edit mode inline
  editContainerInline: {
    alignItems: "center",
    gap: 12,
    width: "100%",
    paddingHorizontal: 24,
  },
  nameInputInline: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.textPrimary,
    width: "100%",
  },
  editActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
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
