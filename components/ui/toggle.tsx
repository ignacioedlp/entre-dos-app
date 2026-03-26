import { Colors } from "@/constants/colors";
import React from "react";
import { Pressable, View } from "react-native";

interface ToggleProps {
  value: boolean;
  onToggle: () => void;
}

export function Toggle({ value, onToggle }: ToggleProps) {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={8}
      style={{
        width: 50,
        height: 30,
        borderRadius: 15,
        backgroundColor: value ? Colors.pasion : "#D1D5DB",
        justifyContent: "center",
        alignItems: value ? "flex-end" : "flex-start",
        paddingHorizontal: 3,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: "#fff",
          boxShadow: "0px 1px 4px rgba(0,0,0,0.2)",
        }}
      />
    </Pressable>
  );
}
