import { Redirect, Tabs } from 'expo-router';

import { CustomTabBar } from '../../components/navigation/CustomTabBar';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout() {
  const { user, token } = useAuth();

  if (!user || !token) {
    return <Redirect href="/(auth)/welcome" />;
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
