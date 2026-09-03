import React from 'react';
import { Pressable, View } from 'react-native';
import { useColors } from '@/context/ThemeContext';

interface ToggleProps {
  value: boolean;
  onToggle: () => void;
  accessibilityLabel?: string;
}

export function Toggle({ value, onToggle, accessibilityLabel }: ToggleProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      style={{
        width: 50,
        height: 30,
        borderRadius: 15,
        backgroundColor: value ? colors.pasion : colors.textMuted,
        justifyContent: 'center',
        alignItems: value ? 'flex-end' : 'flex-start',
        paddingHorizontal: 3,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#fff',
          boxShadow: '0px 1px 4px rgba(0,0,0,0.2)',
        }}
      />
    </Pressable>
  );
}
