import { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import {
  RarityKey,
  rarityColor,
  rarityGlow,
  rarityTextColor,
} from "../../constants/colors";
import { CardHistoryItem } from "../../lib/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SHEEN_W = 72;
const PARTNER_CARD_W = SCREEN_WIDTH - 48;

const RARITY_MAP: Record<string, RarityKey> = {
  common: "comun",
  rare: "rara",
  epic: "epica",
  legendary: "legendaria",
};

const CATEGORY_LABEL: Record<string, string> = {
  date: "CITA",
  action: "ACCIÓN",
  home: "HOGAR",
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

interface PartnerLastPlayProps {
  play: CardHistoryItem;
}

export function PartnerLastPlay({ play }: PartnerLastPlayProps) {
  const rarity = RARITY_MAP[play.rarity] ?? "comun";
  const bg = rarityColor[rarity];
  const fg = rarityTextColor[rarity];
  const glow = rarityGlow[rarity];

  const sheenX = useSharedValue(-SHEEN_W);
  const heartScale = useSharedValue(1);

  useEffect(() => {
    heartScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 110 }),
        withTiming(1.0, { duration: 130 }),
        withTiming(1.25, { duration: 95 }),
        withTiming(1.0, { duration: 130 }),
        withTiming(1.0, { duration: 900 }),
      ),
      -1,
      false,
    );
  }, []);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  useEffect(() => {
    function sweep() {
      sheenX.value = -SHEEN_W;
      sheenX.value = withDelay(
        1800,
        withTiming(PARTNER_CARD_W + SHEEN_W, { duration: 750 }, (done) => {
          if (done) runOnJS(sweep)();
        }),
      );
    }
    sweep();
  }, []);

  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sheenX.value }, { rotate: "12deg" }],
  }));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          shadowColor: glow,
          shadowOpacity: 0.65,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
        },
      ]}
    >
      {/* Diagonal base glare */}
      <LinearGradient
        colors={["rgba(255,255,255,0.18)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Holographic sheen sweep */}
      <Animated.View
        style={[styles.sheenStrip, sheenStyle]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.26)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <View style={styles.inner}>
        <View style={styles.top}>
          <Text style={[styles.label, { color: fg }]}>
            {CATEGORY_LABEL[play.category] ?? play.category.toUpperCase()}
          </Text>
          <Text style={[styles.title, { color: fg }]} numberOfLines={2}>
            {play.title}
          </Text>
          <Text style={[styles.label, { color: fg }]} numberOfLines={3}>
            {play.description}
          </Text>
        </View>

        <View style={[styles.footer, { borderTopColor: `${fg}30` }]}>
          <Text style={[styles.playerName, { color: fg }]}>
            {play.userName ?? "Tu pareja"}
          </Text>
          <Text style={[styles.footerSep, { color: fg }]}> · </Text>
          <Text style={[styles.footerTime, { color: fg }]}>
            {timeAgo(play.playedAt)}
          </Text>
          <View style={styles.spacer} />
          <Animated.View style={heartStyle}>
            <Ionicons name="heart" size={18} color={fg} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
  },
  sheenStrip: {
    position: "absolute",
    top: -20,
    bottom: -20,
    width: SHEEN_W,
  },
  inner: {
    padding: 18,
    gap: 14,
  },
  top: {
    gap: 6,
  },
  label: {
    fontFamily: "Inter_900Black",
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    opacity: 0.5,
  },
  title: {
    fontFamily: "Inter_900Black",
    fontSize: 20,
    lineHeight: 24,
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 12,
  },
  playerName: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  footerSep: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    opacity: 0.5,
  },
  footerTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    opacity: 0.65,
  },
  spacer: {
    flex: 1,
  },
});
