import { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

import { WeekTimeline } from "../../components/cards/WeekTimeline";
import {
  CylinderCard,
  CARD_HEIGHT,
  CARD_WIDTH,
  ANGLE_PER_CARD,
} from "../../components/carousel/CylinderCard";
import { PartnerLastPlay } from "../../components/cards/PartnerLastPlay";
import { AllPlayedState } from "../../components/home/AllPlayedState";
import { Colors } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { apiGetDeck, apiGetHistory, DeckCard } from "../../lib/api";
import { useNotificationList } from "../../hooks/use-notification-list";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function clamp(value: number, min: number, max: number) {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["deck"],
    queryFn: apiGetDeck,
  });

  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["deck-history"],
    queryFn: apiGetHistory,
  });

  const { hasUnread } = useNotificationList();

  const allCards = data?.cards ?? [];
  const cards = allCards.filter((c) => c.status !== "played");
  const cardsRef = useRef<DeckCard[]>([]);
  cardsRef.current = cards;

  const rotation = useSharedValue(0);
  const baseRotation = useSharedValue(0);
  const dragY = useSharedValue(0);

  function navigateToCard(card: DeckCard) {
    router.push(`/play-card/?data=${encodeURIComponent(JSON.stringify(card))}`);
  }

  function doNavigate(card: DeckCard) {
    dragY.value = withTiming(0, { duration: 200 });
    navigateToCard(card);
  }

  const pan = Gesture.Pan()
    .onBegin(() => {
      baseRotation.value = rotation.value;
    })
    .onUpdate((e) => {
      const isVertical =
        Math.abs(e.translationY) > Math.abs(e.translationX) &&
        e.translationY > 0;
      if (isVertical) {
        dragY.value = e.translationY;
      } else {
        dragY.value = 0;
        rotation.value = baseRotation.value + e.translationX * -0.22;
      }
    })
    .onEnd(() => {
      const list = cardsRef.current;
      if (!list.length) return;

      if (dragY.value > 80) {
        const activeIdx = clamp(
          Math.round(rotation.value / ANGLE_PER_CARD),
          0,
          list.length - 1,
        );
        const card = list[activeIdx];
        dragY.value = withTiming(CARD_HEIGHT * 1.3, { duration: 260 }, () => {
          runOnJS(doNavigate)(card);
        });
        return;
      }

      dragY.value = withSpring(0, { damping: 18, stiffness: 200 });

      const nearest = clamp(
        Math.round(rotation.value / ANGLE_PER_CARD),
        0,
        list.length - 1,
      );
      rotation.value = withSpring(nearest * ANGLE_PER_CARD, {
        damping: 18,
        stiffness: 200,
      });
      baseRotation.value = nearest * ANGLE_PER_CARD;
    });

  const partnerLastPlay =
    historyData?.history.find((p) => p.userId !== user?.userId) ?? null;

  const showAllPlayed = !isLoading && allCards.length > 0 && cards.length === 0;
  const showNeverDealt = !isLoading && allCards.length === 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Text style={styles.greeting}>HORA DE DIVERTIRSE.</Text>
        <Pressable onPress={() => router.push("/notifications")}>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={Colors.textPrimary}
          />
          {hasUnread && <View style={styles.badge} />}
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          {showNeverDealt ? (
            <View style={styles.empty}>
              <Text style={styles.emoji}>🃏</Text>
              <Text style={styles.emptyTitle}>Tus cartas llegan el lunes</Text>
              <Text style={styles.emptyBody}>
                Vinculá tu pareja y el próximo lunes a las 00:00 recibirán sus 7
                cartas.
              </Text>
            </View>
          ) : showAllPlayed ? (
            <AllPlayedState />
          ) : (
            <View style={styles.carouselSection}>
              {partnerLastPlay && <PartnerLastPlay play={partnerLastPlay} />}
              <View style={styles.container}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>TU BARAJA</Text>
                </View>
                <View style={styles.divider} />
              </View>
              <GestureDetector gesture={pan}>
                <Animated.View style={styles.carouselHitArea}>
                  <View style={styles.carouselStage}>
                    {cards.map((card, i) => (
                      <CylinderCard
                        key={card.id}
                        card={card}
                        index={i}
                        rotation={rotation}
                        dragY={dragY}
                      />
                    ))}
                  </View>
                </Animated.View>
              </GestureDetector>

              <View style={styles.hint}>
                <Text style={styles.hintText}>
                  Desliza para ver tus cartas y cuando quieras usarla deslizala
                  hacia abajo.
                </Text>
                <View style={styles.chevrons}>
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={Colors.textMuted}
                  />
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={Colors.textMuted}
                    style={{ opacity: 0.45, marginTop: -10 }}
                  />
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={Colors.textMuted}
                    style={{ opacity: 0.25, marginTop: -10 }}
                  />
                </View>
              </View>
            </View>
          )}

          <WeekTimeline
            plays={historyData?.history ?? []}
            isLoading={isHistoryLoading}
            currentUserId={user?.userId ?? ""}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 20,
  },
  container: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Inter_900Black",
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    color: Colors.textMuted,
  },
  greeting: {
    fontFamily: "Inter_900Black",
    fontSize: 28,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: "Inter_900Black",
    fontSize: 22,
    textTransform: "uppercase",
    letterSpacing: -0.5,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
    textAlign: "center",
    maxWidth: 280,
  },
  carouselSection: {
    flex: 1,
  },
  carouselHitArea: {
    width: SCREEN_WIDTH,
    height: CARD_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  carouselStage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    alignItems: "center",
    marginTop: 24,
    paddingHorizontal: 48,
  },
  hintText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 10,
  },
  chevrons: {
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.pasion,
  },
});
