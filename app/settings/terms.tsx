import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Colors } from '@/constants/colors';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('settings');

  const items = t('terms.items', { returnObjects: true }) as {
    title: string;
    body: string;
  }[];

  return (
    <View style={styles.root}>
      <View style={styles.handle} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('terms.title')}</Text>
        <Text style={styles.lastUpdated}>{t('terms.lastUpdated')}</Text>

        {items.map((item) => (
          <View key={item.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
            <Text style={styles.sectionBody}>{item.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: 'Inter_900Black',
    fontSize: 24,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  lastUpdated: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  sectionBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
});
