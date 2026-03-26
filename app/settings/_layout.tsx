import { Stack } from "expo-router";

export default function SettingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0a0c10" },
        animation: "fade",
      }}
    />
  );
}
