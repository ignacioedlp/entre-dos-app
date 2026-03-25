import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface ButtonProps {
  label:      string;
  onPress:    () => void;
  variant?:   'accent' | 'ghost';
  style?:     ViewStyle;
  disabled?:  boolean;
}

export function Button({ label, onPress, variant = 'accent', style, disabled }: ButtonProps) {
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
      <Text style={[styles.label, isAccent ? styles.labelAccent : styles.labelGhost]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius:    9999,
    paddingVertical: 16,
    alignItems:      'center',
    justifyContent:  'center',
  },
  accent: {
    backgroundColor: Colors.accent,
    shadowColor:     Colors.accent,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.45,
    shadowRadius:    20,
    elevation:       12,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  pressed: {
    opacity:   0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontFamily:    'Inter_700Bold',
    fontSize:      16,
    letterSpacing: 0.3,
  },
  labelAccent: {
    color: '#ffffff',
  },
  labelGhost: {
    color: Colors.textSecondary,
  },
});
