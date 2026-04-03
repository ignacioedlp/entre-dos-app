import { Stack } from 'expo-router';
import { useColors } from '@/context/ThemeContext';

const FORMSHEET_OPTIONS = {
  presentation: 'formSheet' as const,
  headerShown: false,
  sheetAllowedDetents: [0.85],
  sheetInitialDetentIndex: 0,
  sheetGrabberVisible: true,
  sheetCornerRadius: 16,
};

export default function SettingLayout() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="country" />
      <Stack.Screen name="font-size" />
      <Stack.Screen name="theme" />
      <Stack.Screen name="terms" options={FORMSHEET_OPTIONS} />
      <Stack.Screen name="privacy" options={FORMSHEET_OPTIONS} />
      <Stack.Screen name="faq" options={FORMSHEET_OPTIONS} />
    </Stack>
  );
}
