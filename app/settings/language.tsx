import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Svg, G, Path, Defs, ClipPath } from "react-native-svg";

import { useQueryClient } from "@tanstack/react-query";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { apiUpdateLocale } from "@/lib/api";
import i18n from "@/i18n";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  {
    locale: "es",
    label: "Español",
    flag: (
      <Svg width={24} height={24} fill="none" viewBox="0 0 24 24">
        <G clipPath="url(#AR_svg__a)">
          <Path
            d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z"
            fill="#F0F0F0"
          />
          <Path
            d="M12-.001A12 12 0 001.192 6.782H22.81A12 12 0 0012-.001zm0 24a12 12 0 0010.81-6.783H1.191A12 12 0 0012.001 24z"
            fill="#338AF3"
          />
          <Path
            d="M15.586 12l-1.465.69.78 1.419-1.591-.305-.202 1.608L12 14.229l-1.109 1.183-.201-1.608-1.592.305.78-1.42L8.414 12l1.466-.69-.78-1.419 1.59.305.202-1.608L12 9.771l1.108-1.183.202 1.608 1.59-.306-.78 1.42 1.465.689z"
            fill="#FFDA44"
          />
        </G>
        <Defs>
          <ClipPath id="AR_svg__a">
            <Path fill="#fff" d="M0 0h24v24H0z" />
          </ClipPath>
        </Defs>
      </Svg>
    ),
  },
  {
    locale: "en",
    label: "English",
    flag: (
      <Svg width={24} height={24} fill="none" viewBox="0 0 24 24">
        <G clipPath="url(#US_svg__a)">
          <Path
            d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z"
            fill="#F0F0F0"
          />
          <Path
            d="M11.477 12H24a12.01 12.01 0 00-.413-3.13H11.478V12zm0-6.262h10.761a12.064 12.064 0 00-2.769-3.13h-7.992v3.13zM12 24c2.824 0 5.42-.976 7.47-2.609H4.53A11.948 11.948 0 0012 24zM1.761 18.26h20.477a11.93 11.93 0 001.348-3.13H.413c.3 1.116.758 2.167 1.348 3.13z"
            fill="#D80027"
          />
          <Path
            d="M5.559 1.874h1.093l-1.017.739.389 1.196-1.018-.74-1.017.74.336-1.033c-.896.746-1.68 1.62-2.328 2.594h.35l-.647.47c-.1.168-.197.34-.29.513l.31.951-.578-.419C1 7.19.868 7.5.75 7.817l.34 1.048h1.258l-1.017.74.388 1.195-1.017-.739-.61.443C.033 10.994 0 11.494 0 12h12V0C9.63 0 7.42.688 5.559 1.874zm.465 8.926l-1.018-.739-1.017.739.389-1.196-1.017-.739h1.257l.388-1.195.389 1.195h1.257l-1.017.74.389 1.195zm-.389-4.691l.389 1.195-1.018-.739-1.017.74.389-1.196-1.017-.74h1.257l.388-1.195.389 1.196h1.257l-1.017.739zm4.693 4.691l-1.017-.739-1.017.739.388-1.196-1.017-.739h1.257l.389-1.195.388 1.195h1.258l-1.018.74.389 1.195zm-.389-4.691l.389 1.195-1.017-.739-1.017.74.388-1.196-1.017-.74h1.257l.389-1.195.388 1.196h1.258l-1.018.739zm0-3.496l.389 1.196-1.017-.74-1.017.74.388-1.196-1.017-.739h1.257L9.311.678l.388 1.196h1.258l-1.018.739z"
            fill="#0052B4"
          />
        </G>
        <Defs>
          <ClipPath id="US_svg__a">
            <Path fill="#fff" d="M0 0h24v24H0z" />
          </ClipPath>
        </Defs>
      </Svg>
    ),
  },
] as const;

export default function LanguageScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation("settings");
  const queryClient = useQueryClient();

  async function handleSelect(locale: "es" | "en") {
    if (loading || locale === user?.locale) return;
    setLoading(true);
    try {
      const updated = await apiUpdateLocale(locale);
      updateProfile(updated);
      i18n.changeLanguage(locale);
      queryClient.invalidateQueries();
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.background} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("language.title")}</Text>
      </View>

      {LANGUAGES.map((lang, idx) => {
        const isSelected = user?.locale === lang.locale;
        return (
          <Pressable
            key={lang.locale}
            onPress={() => handleSelect(lang.locale)}
            disabled={loading}
            style={[
              styles.row,
              idx === 0 && styles.rowFirst,
              loading && styles.rowDisabled,
            ]}
          >
            {lang.flag}
            <Text style={styles.label}>{lang.label}</Text>
            {isSelected && (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={Colors.accent}
              />
            )}
          </Pressable>
        );
      })}
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
  },
  backBtn: {
    width: 40,
    backgroundColor: Colors.textPrimary,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
  },
  headerTitle: {
    fontFamily: "Inter_900Black",
    fontSize: 28,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  rowFirst: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  flag: {
    fontSize: 24,
  },
  label: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.textPrimary,
  },
});
