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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import moment from "moment";
import "moment/locale/es";

import { Colors } from "@/constants/colors";
import {
  apiGetCoupleStatus,
  apiUpdateCoupleAnniversary,
} from "@/lib/api";
import i18n from "@/i18n";

export default function RelationshipScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation("settings");
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState<string | null>(null);

  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["couple-status"],
    queryFn: apiGetCoupleStatus,
  });

  const mutation = useMutation({
    mutationFn: apiUpdateCoupleAnniversary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["couple-status"] });
    },
  });

  const couple = data?.couple;

  function startEditing() {
    setError(null);
    if (couple?.anniversary) {
      const m = moment(couple.anniversary);
      setDay(m.format("DD"));
      setMonth(m.format("MM"));
      setYear(m.format("YYYY"));
    } else {
      setDay("");
      setMonth("");
      setYear("");
    }
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError(null);
  }

  function handleDayChange(text: string) {
    const clean = text.replace(/\D/g, "");
    setDay(clean);
    if (clean.length === 2) monthRef.current?.focus();
  }

  function handleMonthChange(text: string) {
    const clean = text.replace(/\D/g, "");
    setMonth(clean);
    if (clean.length === 2) yearRef.current?.focus();
  }

  function handleYearChange(text: string) {
    setYear(text.replace(/\D/g, ""));
  }

  async function handleSave() {
    setError(null);

    if (!day || !month || !year || year.length < 4) {
      setError(t("relationship.errorRequired"));
      return;
    }

    const dateStr = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const parsed = moment(dateStr, "YYYY-MM-DD", true);

    if (!parsed.isValid()) {
      setError(t("relationship.errorInvalidDate"));
      return;
    }

    if (parsed.isAfter(moment(), "day")) {
      setError(t("relationship.errorFutureDate"));
      return;
    }

    try {
      await mutation.mutateAsync(dateStr);
      setEditing(false);
    } catch {
      setError(t("relationship.errorInvalidDate"));
    }
  }

  async function handleRemove() {
    try {
      await mutation.mutateAsync(null);
      setEditing(false);
    } catch {
      // silently ignore
    }
  }

  const linkedDate = couple?.linkedAt
    ? moment(couple.linkedAt).locale(i18n.language).format("LL")
    : "";

  const anniversaryDate = couple?.anniversary
    ? moment(couple.anniversary).locale(i18n.language).format("LL")
    : null;

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 20 }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.background} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("relationship.title")}</Text>
      </View>

      {isLoading && (
        <ActivityIndicator
          color={Colors.accent}
          size="large"
          style={{ marginTop: 60 }}
        />
      )}

      {couple && (
        <>
          {/* Partner Card */}
          <View style={styles.card}>
            <View style={styles.heartWrap}>
              <Ionicons name="heart" size={28} color={Colors.accent} />
            </View>

            <View style={styles.namesRow}>
              <Text style={styles.name} numberOfLines={1}>
                {couple.userADisplayName ?? "Partner"}
              </Text>
              <Text style={styles.ampersand}>&</Text>
              <Text style={styles.name} numberOfLines={1}>
                {couple.userBDisplayName ?? "Partner"}
              </Text>
            </View>

            <Text style={styles.since}>
              {t("relationship.togetherSince", { date: linkedDate })}
            </Text>
          </View>

          {/* Anniversary Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {t("relationship.anniversary")}
            </Text>

            {!editing ? (
              <View style={styles.anniversaryView}>
                {anniversaryDate ? (
                  <>
                    <View style={styles.dateDisplay}>
                      <Ionicons
                        name="calendar"
                        size={20}
                        color={Colors.accent}
                      />
                      <Text style={styles.dateText}>{anniversaryDate}</Text>
                    </View>
                    <Pressable
                      onPress={startEditing}
                      style={styles.editBtn}
                    >
                      <Ionicons
                        name="pencil"
                        size={18}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.editBtnText}>
                        {t("relationship.edit")}
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable onPress={startEditing} style={styles.setDateBtn}>
                    <Ionicons
                      name="add-circle-outline"
                      size={22}
                      color={Colors.accent}
                    />
                    <Text style={styles.setDateText}>
                      {t("relationship.setDate")}
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <View style={styles.editContainer}>
                {/* Date Inputs */}
                <View style={styles.inputsRow}>
                  <TextInput
                    style={styles.dateInput}
                    value={day}
                    onChangeText={handleDayChange}
                    placeholder={t("relationship.day")}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                    textAlign="center"
                    autoFocus
                  />
                  <Text style={styles.separator}>/</Text>
                  <TextInput
                    ref={monthRef}
                    style={styles.dateInput}
                    value={month}
                    onChangeText={handleMonthChange}
                    placeholder={t("relationship.month")}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                    textAlign="center"
                  />
                  <Text style={styles.separator}>/</Text>
                  <TextInput
                    ref={yearRef}
                    style={[styles.dateInput, styles.yearInput]}
                    value={year}
                    onChangeText={handleYearChange}
                    placeholder={t("relationship.year")}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={4}
                    textAlign="center"
                  />
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                {/* Actions */}
                <Pressable
                  onPress={handleSave}
                  disabled={mutation.isPending}
                  style={({ pressed }) => [
                    styles.saveBtn,
                    pressed && { opacity: 0.8 },
                    mutation.isPending && { opacity: 0.5 },
                  ]}
                >
                  {mutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {t("relationship.save")}
                    </Text>
                  )}
                </Pressable>

                <View style={styles.secondaryActions}>
                  <Pressable onPress={cancelEditing} style={styles.textBtn}>
                    <Text style={styles.textBtnLabel}>
                      {t("relationship.cancel")}
                    </Text>
                  </Pressable>

                  {couple.anniversary && (
                    <Pressable
                      onPress={handleRemove}
                      disabled={mutation.isPending}
                      style={styles.textBtn}
                    >
                      <Text style={[styles.textBtnLabel, { color: Colors.accent }]}>
                        {t("relationship.remove")}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
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

  // Partner Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 24,
    alignItems: "center",
    gap: 16,
  },
  heartWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 59, 92, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  namesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  ampersand: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.accent,
  },
  since: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Anniversary Section
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 1,
    color: Colors.textMuted,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  anniversaryView: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    gap: 14,
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.textPrimary,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  editBtnText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  setDateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  setDateText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.accent,
  },

  // Edit Mode
  editContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    gap: 16,
  },
  inputsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dateInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    width: 56,
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  yearInput: {
    width: 80,
  },
  separator: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.textMuted,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.accent,
    textAlign: "center",
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
  secondaryActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  textBtn: {
    paddingVertical: 4,
  },
  textBtnLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
