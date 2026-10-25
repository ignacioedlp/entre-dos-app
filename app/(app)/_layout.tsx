import { Redirect, Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CustomTabBar } from '../../components/navigation/CustomTabBar';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../context/ThemeContext';

export default function AppLayout() {
  const { user, token } = useAuth();
  const colors = useColors();
  const { t } = useTranslation('common');

  if (!user || !token) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (Platform.OS === 'ios') {
    return (
      <NativeTabs tintColor={colors.pasion}>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
          <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="album">
          <NativeTabs.Trigger.Icon
            sf={{ default: 'photo.on.rectangle', selected: 'photo.fill.on.rectangle.fill' }}
          />
          <NativeTabs.Trigger.Label>{t('tabs.album')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="packs">
          <NativeTabs.Trigger.Icon
            sf={{ default: 'square.stack', selected: 'square.stack.fill' }}
          />
          <NativeTabs.Trigger.Label>{t('tabs.packs')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} />
          <NativeTabs.Trigger.Label>{t('tabs.profile')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...(props as any)} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="album" />
      <Tabs.Screen name="packs" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
