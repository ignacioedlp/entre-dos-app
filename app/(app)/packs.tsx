import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { PackCard, PACK_THEMES } from "../../components/cards/PackCard";
import { Colors } from "../../constants/colors";
import { apiGetPacks } from "../../lib/api";

const CARD_PADDING = 24;

export default function PacksScreen() {
  const insets = useSafeAreaInsets();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["packs"],
    queryFn: apiGetPacks,
  });

  const packs = data?.packs.sort((a, b) => a.priceUsd - b.priceUsd) ?? [];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>PACKS DISPONIBLES.</Text>
        <Text style={styles.subtitle}>
          Agrega mas tarjeta a tu mazo semanal para que tengas mas mejores
          experiencias.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.accent}
            />
          }
        >
          {/* First two packs side by side */}
          {packs.length >= 2 && (
            <View style={styles.row}>
              <PackCard
                pack={packs[0]}
                theme={PACK_THEMES[0 % PACK_THEMES.length]}
                half
              />
              <PackCard
                pack={packs[1]}
                theme={PACK_THEMES[1 % PACK_THEMES.length]}
                half
              />
            </View>
          )}
          {packs.length === 1 && (
            <PackCard
              pack={packs[0]}
              theme={PACK_THEMES[0 % PACK_THEMES.length]}
            />
          )}
          {/* Remaining packs full width */}
          {packs.slice(2).map((pack, i) => (
            <PackCard
              key={pack.id}
              pack={pack}
              theme={PACK_THEMES[(i + 2) % PACK_THEMES.length]}
            />
          ))}
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
  header: {
    paddingHorizontal: CARD_PADDING,
    marginBottom: 24,
  },
  title: {
    fontFamily: "Inter_900Black",
    fontSize: 28,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: CARD_PADDING,
    paddingBottom: 32,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
});
