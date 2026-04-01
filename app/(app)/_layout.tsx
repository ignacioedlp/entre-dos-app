import { Tabs } from 'expo-router';

import { CustomTabBar } from '../../components/navigation/CustomTabBar';

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...(props as any)} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="packs" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
