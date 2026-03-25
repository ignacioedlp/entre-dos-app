import { View, Text, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { Colors } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";

const TRACK_HEIGHT = 64;
const THUMB_SIZE = 52;
const PADDING = 6;

interface SwipeToConfirmProps {
  onConfirm: () => void;
  label?: string;
}

export function SwipeToConfirm({
  onConfirm,
  label = "CONFIRMAR",
}: SwipeToConfirmProps) {
  const translateX = useSharedValue(0);
  const trackWidth = useSharedValue(0);
  const confirmed = useSharedValue(false);

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      const max = trackWidth.value - THUMB_SIZE - PADDING * 2;
      translateX.value = Math.max(0, Math.min(e.translationX, max));
    })
    .onEnd(() => {
      const max = trackWidth.value - THUMB_SIZE - PADDING * 2;
      if (translateX.value > max * 0.82 && !confirmed.value) {
        confirmed.value = true;
        translateX.value = withSpring(max, { damping: 22, stiffness: 200 });
        runOnJS(onConfirm)();
      } else {
        translateX.value = withSpring(0, { damping: 22, stiffness: 200 });
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const labelStyle = useAnimatedStyle(() => {
    const max = trackWidth.value - THUMB_SIZE - PADDING * 2;
    return {
      opacity: interpolate(translateX.value, [0, max * 0.45], [1, 0]),
    };
  });

  return (
    <View
      style={styles.track}
      onLayout={(e) => {
        trackWidth.value = e.nativeEvent.layout.width;
      }}
    >
      <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.thumb, thumbStyle]}>
          <Ionicons name="arrow-forward" style={styles.arrow} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: TRACK_HEIGHT / 2,
    padding: PADDING,
    justifyContent: "center",
    overflow: "hidden",
  },
  label: {
    position: "absolute",
    right: 120,
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 2,
    color: Colors.textMuted,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  arrow: {
    fontSize: 22,
    color: Colors.background,
  },
});
