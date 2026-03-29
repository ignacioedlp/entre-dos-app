import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_700Bold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { RevenueCatProvider } from '../context/RevenueCatContext';
import ToastManager from 'toastify-react-native';
import { SuccessToast, ErrorToast, WarnToast, InfoToast } from '../components/ui/CustomToast';
import * as Notifications from 'expo-notifications';
import { NotificationSetup } from '@/components/notifications/notification-setup';

const toastConfig = {
  success: (props: any) => <SuccessToast {...props} />,
  error: (props: any) => <ErrorToast {...props} />,
  warn: (props: any) => <WarnToast {...props} />,
  info: (props: any) => <InfoToast {...props} />,
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
    Inter_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Notification listeners (foreground receive + tap response)
  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener((_notification) => {
      // Notification received while app is in foreground — handler above manages display
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener((_response) => {
      // User tapped a notification — add navigation logic here when needed
    });
    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RevenueCatProvider>
              <NotificationSetup />
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
                <Stack.Screen
                  name="play-card"
                  options={{
                    presentation: 'formSheet',
                    headerShown: false,
                    sheetAllowedDetents: [0.5],
                    sheetInitialDetentIndex: 0,
                    sheetGrabberVisible: true,
                    sheetCornerRadius: 16,
                  }}
                />
                <Stack.Screen
                  name="paywall"
                  options={{
                    presentation: 'formSheet',
                    headerShown: false,
                    sheetAllowedDetents: [0.85],
                    sheetInitialDetentIndex: 0,
                    sheetGrabberVisible: true,
                    sheetCornerRadius: 16,
                  }}
                />
                <Stack.Screen name="notifications" options={{ headerShown: false }} />
              </Stack>
              <ToastManager
                config={toastConfig}
                showProgressBar
                animationStyle="fade"
                position="top"
                topOffset={56}
              />
            </RevenueCatProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
