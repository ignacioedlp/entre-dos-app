import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Leave room to scroll the last item above the floating iOS tab bar. */
export function useTabContentPadding() {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'ios' ? { paddingBottom: insets.bottom + 80 } : undefined;
}
