import { useMemo } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { ThemeColors } from '../../constants/colors';
import { useColors } from '../../context/ThemeContext';
import { Typography } from './Typography';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'accent' | 'ghost';
  style?: ViewStyle;
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'accent', style, disabled }: ButtonProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isAccent = variant === 'accent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        isAccent ? styles.accent : styles.ghost,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Typography variant="button" color={isAccent ? '#ffffff' : colors.textSecondary}>
        {label}
      </Typography>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    base: {
      borderRadius: 9999,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accent: {
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 20,
      elevation: 12,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    disabled: {
      opacity: 0.4,
    },
  });
}
