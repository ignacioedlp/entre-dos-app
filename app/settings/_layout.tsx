import { Stack } from 'expo-router';

const FORMSHEET_OPTIONS = {
  presentation: 'formSheet' as const,
  headerShown: false,
  sheetAllowedDetents: [0.85],
  sheetInitialDetentIndex: 0,
  sheetGrabberVisible: true,
  sheetCornerRadius: 16,
};

export default function SettingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0c10' },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="country" />
      <Stack.Screen name="terms" options={FORMSHEET_OPTIONS} />
      <Stack.Screen name="privacy" options={FORMSHEET_OPTIONS} />
      <Stack.Screen name="faq" options={FORMSHEET_OPTIONS} />
    </Stack>
  );
}
