import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useColors } from '@/context/ThemeContext';

export default function SettingLayout() {
  const colors = useColors();
  const formSheetOptions = {
    presentation: 'pageSheet' as const,
    // iOS already has the sheet dismissal gesture; its native header disrupts
    // the sheet layout. Android needs an explicit visible way back.
    headerShown: Platform.OS === 'android',
    headerTitle: '',
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.textPrimary,
    headerShadowVisible: false,
  };

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
      <Stack.Screen name="terms" options={formSheetOptions} />
      <Stack.Screen name="privacy" options={formSheetOptions} />
      <Stack.Screen name="faq" options={formSheetOptions} />
    </Stack>
  );
}
