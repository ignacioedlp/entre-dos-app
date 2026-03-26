import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useTranslation } from "react-i18next";

import { Pack } from "../../lib/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_PADDING = 24;
const HALF_CARD = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;

export const PACK_THEMES: {
  bg: string;
  text: string;
  subText: string;
  btnBg: string;
  btnText: string;
}[] = [
  {
    bg: "#E8EBF0",
    text: "#0f1115",
    subText: "rgba(15,17,21,0.5)",
    btnBg: "#0f1115",
    btnText: "#ffffff",
  },
  {
    bg: "#FF3B5C",
    text: "#ffffff",
    subText: "rgba(255,255,255,0.6)",
    btnBg: "#ffffff",
    btnText: "#FF3B5C",
  },
  {
    bg: "#F59E0B",
    text: "#451a03",
    subText: "rgba(69,26,3,0.6)",
    btnBg: "#0a0c10",
    btnText: "#ffffff",
  },
  {
    bg: "#a855f7",
    text: "#ffffff",
    subText: "rgba(255,255,255,0.6)",
    btnBg: "#ffffff",
    btnText: "#a855f7",
  },
  {
    bg: "#38bdf8",
    text: "#0f1115",
    subText: "rgba(15,17,21,0.5)",
    btnBg: "#0f1115",
    btnText: "#ffffff",
  },
];

interface PackCardProps {
  pack: Pack;
  theme: (typeof PACK_THEMES)[number];
  half?: boolean;
}

export function PackCard({ pack, theme, half }: PackCardProps) {
  const cardWidth = half ? HALF_CARD : SCREEN_WIDTH - CARD_PADDING * 2;
  const { t } = useTranslation("home");

  function formatPrice(isBase: boolean): string {
    return isBase ? t("packs.free") : t("packs.premium");
  }

  return (
    <View
      style={[styles.card, { backgroundColor: theme.bg, width: cardWidth }]}
    >
      <Text style={[styles.priceLabel, { color: theme.subText }]}>
        {formatPrice(pack.isBase)}
      </Text>
      <Text style={[styles.packName, { color: theme.text }]}>
        {pack.name.toUpperCase()}
      </Text>
      <Text style={[styles.packSubtitle, { color: theme.subText }]}>
        {pack.subtitle.toUpperCase()}
      </Text>

      <View style={styles.cardSpacer} />

      <Text style={[styles.packQuote, { color: theme.subText }]}>
        "{pack.description}"
      </Text>

      {!pack.owned && !pack.isBase && (
        <TouchableOpacity
          style={[styles.buyButton, { backgroundColor: theme.btnBg }]}
          activeOpacity={0.85}
        >
          <Text style={[styles.buyButtonText, { color: theme.btnText }]}>
            {t("packs.buy")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    minHeight: 220,
  },
  priceLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  packName: {
    fontFamily: "Inter_900Black",
    fontSize: 18,
    letterSpacing: -0.5,
    lineHeight: 28,
    marginBottom: 4,
  },
  packSubtitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  cardSpacer: {
    flex: 1,
    minHeight: 24,
  },
  packQuote: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
    marginBottom: 16,
  },
  buyButton: {
    borderRadius: 100,
    paddingVertical: 12,
    alignItems: "center",
  },
  buyButtonText: {
    fontFamily: "Inter_900Black",
    fontSize: 10,
    letterSpacing: 1.5,
  },
});
