import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Colors } from "@/constants/colors";

export default function FaqScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation("settings");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const items = t("faq.items", { returnObjects: true }) as {
    question: string;
    answer: string;
  }[];

  function toggle(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  return (
    <View style={styles.root}>
      <View style={styles.handle} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t("faq.title")}</Text>

        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <Pressable
              key={index}
              onPress={() => toggle(index)}
              style={styles.item}
            >
              <View style={styles.questionRow}>
                <Text style={styles.question}>{item.question}</Text>
                <Ionicons
                  name={isOpen ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Colors.textMuted}
                />
              </View>
              {isOpen && <Text style={styles.answer}>{item.answer}</Text>}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: "Inter_900Black",
    fontSize: 24,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
    marginBottom: 24,
  },
  item: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 16,
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  question: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  answer: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
    marginTop: 10,
  },
});
