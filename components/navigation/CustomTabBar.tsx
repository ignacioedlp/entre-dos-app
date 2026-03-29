import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';

const TABS: { name: string; icon: 'home' | 'layers' | 'person' }[] = [
  { name: 'index', icon: 'home' },
  { name: 'packs', icon: 'layers' },
  { name: 'profile', icon: 'person' },
];

interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
}

export function CustomTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom || 12 }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[index];
        const focused = state.index === index;
        const color = focused ? Colors.pasion : Colors.textMuted;
        const iconName = focused ? tab.icon : (`${tab.icon}-outline` as any);

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            activeOpacity={0.7}
            onPress={() => {
              if (!focused) {
                navigation.navigate(route.name);
              }
            }}
          >
            <Ionicons name={iconName} size={24} color={color} />
            {focused && <View style={styles.activeBar} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderTopWidth: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    gap: 6,
  },
  activeBar: {
    width: '60%',
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.pasion,
  },
});
