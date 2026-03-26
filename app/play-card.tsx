import { useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Toast } from "toastify-react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  Colors,
  RarityKey,
  rarityColor,
  rarityTextColor,
} from "../constants/colors";
import { DeckCard, DeckResponse, apiPlayCard } from "../lib/api";
import { SwipeToConfirm } from "../components/ui/SwipeToConfirm";

const RARITY_MAP: Record<string, RarityKey> = {
  common: "comun",
  rare: "rara",
  epic: "epica",
  legendary: "legendaria",
};

function formatExpiry(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
    });
  } catch {
    return "";
  }
}

export default function CardDetailSheet() {
  const { data } = useLocalSearchParams<{ data: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const playing = useRef(false);
  const { t } = useTranslation("home");

  async function handleConfirm(cardId: string) {
    if (playing.current) return;
    playing.current = true;
    try {
      await apiPlayCard(cardId);
      // Update cache immediately so the card disappears from the carousel
      queryClient.setQueryData<DeckResponse>(["deck"], (old) => {
        if (!old) return old;
        return {
          ...old,
          cards: old.cards.map((c) =>
            c.id === cardId ? { ...c, status: "played" as const } : c,
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["deck-history"] });
    } catch {
      // ignore — navigate back regardless
    }
    Toast.success(t("playCard.success"));
    router.back();
  }

  let card: DeckCard | null = null;
  try {
    if (data) card = JSON.parse(decodeURIComponent(data));
  } catch {
    // ignore parse errors
  }

  if (!card) {
    return (
      <View style={[styles.root, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.handle} />
        <Text style={styles.errorText}>{t("playCard.errorLoad")}</Text>
      </View>
    );
  }

  const rarity = RARITY_MAP[card.rarity] ?? "comun";
  const cardBg = rarityColor[rarity];
  const cardFg = rarityTextColor[rarity];
  const isPlayed = card.status === "played";

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 24 }]}>
      {/* Drag handle */}
      <View style={styles.handle} />

      <View style={styles.header}>
        <Text style={styles.title}>{t("playCard.title")}</Text>
        <Text style={styles.description}>{t("playCard.description")}</Text>
      </View>

      {/* Description */}
      <View style={styles.body}>
        <Text style={[styles.cardTitle, { color: cardBg }]}>{card.title}</Text>
        <Text style={styles.cardDescription}>{card.description}</Text>
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        {isPlayed ? (
          <View style={styles.playedBanner}>
            <Text style={styles.playedBannerText}>{t("playCard.played")}</Text>
          </View>
        ) : (
          <SwipeToConfirm onConfirm={() => handleConfirm(card.id)} />
        )}
      </View>
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
  colorBlock: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    gap: 10,
  },
  categoryBadge: {
    fontFamily: "Inter_900Black",
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    opacity: 0.6,
  },
  title: {
    fontFamily: "Inter_900Black",
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textPrimary,
  },
  cardTitle: {
    fontFamily: "Inter_900Black",
    fontSize: 32,
    lineHeight: 34,
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  rarityRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  rarityPill: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rarityPillText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  header: {
    paddingHorizontal: 24,
    gap: 20,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 10,
    flex: 1,
  },
  cardDescription: {
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textPrimary,
  },
  expiry: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  playedBanner: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  playedBannerText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.textSecondary,
  },
  dismissBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  dismissText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textMuted,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 40,
  },
});
