import { View, StyleSheet, Dimensions } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LogoWithName } from "../../components/ui/Logo";
import { Button } from "../../components/ui/Button";
import { GameCard, GameCardData } from "../../components/cards/GameCard";
import { Colors } from "../../constants/colors";

const { width: W, height: H } = Dimensions.get("window");

interface CardLayout extends GameCardData {
  rotation: number;
  left: number; // absolute px
  top: number; // absolute px
  width: number;
}

const STAGGER_MS = 120;

function AnimatedCard({ card, index }: { card: CardLayout; index: number }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);

  useEffect(() => {
    const delay = index * STAGGER_MS;
    const config = { duration: 400, easing: Easing.out(Easing.ease) };
    opacity.value = withDelay(delay, withTiming(1, config));
    scale.value = withDelay(delay, withTiming(1, config));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        { position: "absolute", left: card.left, top: card.top },
        animStyle,
      ]}
    >
      <GameCard
        card={{
          rarity: card.rarity,
          label: card.label,
          title: card.title,
          description: card.description,
        }}
        width={card.width}
        rotation={card.rotation}
      />
    </Animated.View>
  );
}

const PREVIEW_CARDS: CardLayout[] = [
  // Amber — Legendaria, upper-left, tilted left
  {
    rarity: "legendaria",
    label: "LEGENDARIA",
    title: "MASAJE\n10 MINUTOS",
    description: "Relajación y conexión táctil.",
    rotation: -12,
    left: W * -0.06,
    top: H * 0.15,
    width: W * 0.54,
  },
  // Pink — Pasión, upper-right, tilted right
  {
    rarity: "pasion",
    label: "PASIÓN",
    title: "PREGUNTA\nPROHIBIDA",
    description: "Una pregunta que no se debe hacer.",
    rotation: 14,
    left: W * 0.44,
    top: H * 0.1,
    width: W * 0.52,
  },
  // White — Común, lower-left, slight tilt
  {
    rarity: "comun",
    label: "COMÚN",
    title: "CENA SIN\nCELULARES",
    description: "Disfrutar de la compañía sin distracciones.",
    rotation: -8,
    left: W * 0.0,
    top: H * 0.5,
    width: W * 0.5,
  },
  // Blue — Rara, lower-right, tilted right
  {
    rarity: "rara",
    label: "RARA",
    title: "PLAYLIST\nHISTORIA",
    description: "Crear juntos una playlist de Spotify.",
    rotation: 10,
    left: W * 0.46,
    top: H * 0.45,
    width: W * 0.52,
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Scattered card previews ────────────────────────────── */}
      {PREVIEW_CARDS.map((card, i) => (
        <AnimatedCard key={i} card={card} index={i} />
      ))}

      {/* ── Bottom vignette so CTA area is legible ────────────── */}
      <LinearGradient
        colors={["transparent", Colors.background]}
        style={[styles.vignette]}
        pointerEvents="none"
      />

      {/* ── Logo top-left ─────────────────────────────────────── */}
      <View style={[styles.logoArea, { paddingTop: insets.top + 30 }]}>
        <LogoWithName size="lg" />
      </View>

      {/* ── CTA button bottom ─────────────────────────────────── */}
      <View style={[styles.ctaArea, { paddingBottom: insets.bottom + 24 }]}>
        <Button
          label="Iniciar sesión"
          onPress={() => router.push("/(auth)/login")}
        />
        <Button
          label="Crear cuenta"
          variant="ghost"
          onPress={() => router.push("/(auth)/register")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  vignette: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: H * 0.38,
  },
  logoArea: {
    position: "absolute",
    top: 0,
    left: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  ctaArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    zIndex: 10,
    gap: 10,
  },
});
