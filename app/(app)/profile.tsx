import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Text style={styles.greeting}>MI PERFIl.</Text>
        <Pressable onPress={() => router.push("/settings")}>
          <Ionicons
            name="settings-outline"
            size={24}
            color={Colors.textPrimary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  greeting: {
    fontFamily: "Inter_900Black",
    fontSize: 28,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
});
