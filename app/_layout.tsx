import * as Sentry from '@sentry/react-native';
import { vexo } from 'vexo-analytics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Modal, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
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
import { AdsProvider } from '../context/AdsContext';
import { FontScaleProvider } from '../context/FontScaleContext';
import { ThemeProvider, useColors, useTheme } from '../context/ThemeContext';
import ToastManager from 'toastify-react-native';
import { SuccessToast, ErrorToast, WarnToast, InfoToast } from '../components/ui/CustomToast';
import * as Notifications from 'expo-notifications';
import { NotificationSetup } from '@/components/notifications/notification-setup';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { ThemeColors } from '@/constants/colors';

const toastConfig = {
  success: (props: any) => <SuccessToast {...props} />,
  error: (props: any) => <ErrorToast {...props} />,
  warn: (props: any) => <WarnToast {...props} />,
  info: (props: any) => <InfoToast {...props} />,
};

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  enabled: !__DEV__,
});

vexo(process.env.EXPO_PUBLIC_VEXO_API_KEY!);

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

function ThemedStatusBar() {
  const { theme } = useTheme();
  return <StatusBar style={theme === 'light' ? 'dark' : 'light'} />;
}

function UpdatePrompt() {
  const { t } = useTranslation('common');
  const colors = useColors();
  const styles = useMemo(() => createUpdatePromptStyles(colors), [colors]);
  const { isUpdatePending } = Updates.useUpdates();
  const [updateReady, setUpdateReady] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const checkingRef = useRef(false);

  useEffect(() => {
    if (isUpdatePending) setUpdateReady(true);
  }, [isUpdatePending]);

  const checkForUpdate = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled || checkingRef.current || updateReady) return;

    checkingRef.current = true;
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        setUpdateReady(true);
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { flow: 'eas_update_check' } });
    } finally {
      checkingRef.current = false;
    }
  }, [updateReady]);

  useEffect(() => {
    void checkForUpdate();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void checkForUpdate();
    });

    return () => subscription.remove();
  }, [checkForUpdate]);

  const restartWithUpdate = async () => {
    setRestarting(true);
    try {
      await Updates.reloadAsync();
    } catch (error) {
      setRestarting(false);
      Sentry.captureException(error, { tags: { flow: 'eas_update_reload' } });
    }
  };

  return (
    <Modal
      visible={updateReady}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={() => undefined}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Typography variant="heading" baseFontSize={20} style={styles.title}>
            {t('update.title')}
          </Typography>
          <Typography
            variant="body"
            baseFontSize={14}
            baseLineHeight={21}
            color={colors.textSecondary}
            style={styles.message}
          >
            {t('update.message')}
          </Typography>
          <Button
            label={restarting ? t('update.restarting') : t('update.restart')}
            onPress={restartWithUpdate}
            disabled={restarting}
            style={styles.button}
          />
        </View>
      </View>
    </Modal>
  );
}

function RootLayout() {
  const router = useRouter();
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
    let active = true;
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        const playId = response?.notification.request.content.data?.cardPlayId;
        if (active && playId) {
          router.push({ pathname: '/play-thread', params: { playId: String(playId) } });
          Notifications.clearLastNotificationResponseAsync();
        }
      })
      .catch(() => undefined);
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const playId = notification.request.content.data?.cardPlayId;
      if (playId) queryClient.invalidateQueries({ queryKey: ['play-thread', String(playId)] });
      if (notification.request.content.data?.type === 'extra_card_unlocked') {
        queryClient.invalidateQueries({ queryKey: ['deck'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const playId = response.notification.request.content.data?.cardPlayId;
      if (playId) {
        router.push({ pathname: '/play-thread', params: { playId: String(playId) } });
      }
    });
    return () => {
      active = false;
      receivedSub.remove();
      responseSub.remove();
    };
  }, [router]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AdsProvider>
              <RevenueCatProvider>
                <ThemeProvider>
                  <FontScaleProvider>
                    <NotificationSetup />
                    <UpdatePrompt />
                    <ThemedStatusBar />
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
                          presentation: 'pageSheet',
                          headerShown: false,
                        }}
                      />
                      <Stack.Screen name="notifications" options={{ headerShown: false }} />
                      <Stack.Screen name="play-thread" options={{ headerShown: false }} />
                    </Stack>
                    <ToastManager
                      config={toastConfig}
                      showProgressBar
                      animationStyle="fade"
                      position="top"
                      topOffset={56}
                    />
                  </FontScaleProvider>
                </ThemeProvider>
              </RevenueCatProvider>
            </AdsProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function createUpdatePromptStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.72)',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
    },
    title: {
      textAlign: 'center',
    },
    message: {
      marginTop: 10,
      textAlign: 'center',
    },
    button: {
      marginTop: 24,
    },
  });
}

export default Sentry.wrap(RootLayout);
