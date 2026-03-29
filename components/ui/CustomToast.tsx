import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const SUCCESS_COLOR = '#4ade80';
const ERROR_COLOR = Colors.accent; // #FF3B5C
const WARN_COLOR = Colors.legendaria; // #f59e0b
const INFO_COLOR = Colors.rara; // #38bdf8

interface ToastProps {
  text1?: string;
  text2?: string;
  hide?: () => void;
  onPress?: () => void;
  barWidth?: Animated.Value;
  showProgressBar?: boolean;
}

const ToastCard = ({
  text1,
  text2,
  hide,
  onPress,
  barWidth,
  showProgressBar,
  accentColor,
  iconName,
}: ToastProps & {
  accentColor: string;
  iconName: keyof typeof Ionicons.glyphMap;
}) => {
  const handlePress = () => {
    if (onPress) onPress();
    else if (hide) hide();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={[styles.container, { backgroundColor: accentColor, shadowColor: accentColor }]}
    >
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: 'rgba(0,0,0,0.15)' }]}>
        <Ionicons name={iconName} size={20} color="#fff" />
      </View>

      {/* Text */}
      <View style={styles.textWrap}>
        {text1 ? (
          <Text style={styles.title} numberOfLines={2}>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>

      {/* Dismiss hint */}
      <TouchableOpacity
        onPress={hide}
        style={styles.closeBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>

      {/* Progress bar */}
      {showProgressBar && barWidth && (
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              { backgroundColor: 'rgba(0,0,0,0.25)' },
              {
                width: barWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

export const SuccessToast = (props: ToastProps) => (
  <ToastCard {...props} accentColor={SUCCESS_COLOR} iconName="checkmark-circle" />
);

export const ErrorToast = (props: ToastProps) => (
  <ToastCard {...props} accentColor={ERROR_COLOR} iconName="alert-circle" />
);

export const WarnToast = (props: ToastProps) => (
  <ToastCard {...props} accentColor={WARN_COLOR} iconName="warning" />
);

export const InfoToast = (props: ToastProps) => (
  <ToastCard {...props} accentColor={INFO_COLOR} iconName="information-circle" />
);

const styles = StyleSheet.create({
  container: {
    width: '90%',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#fff',
    letterSpacing: 0.1,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 2,
    flexShrink: 0,
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});
