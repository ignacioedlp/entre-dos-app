import { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Colors } from '@/constants/colors';
import { Typography } from '@/components/ui/Typography';

export default function FaqScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('settings');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const items = t('faq.items', { returnObjects: true }) as {
    question: string;
    answer: string;
  }[];

  function toggle(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  return (
    <View style={styles.root}>
      <View style={styles.handle} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Typography variant="heading" baseFontSize={24} style={styles.title}>
          {t('faq.title')}
        </Typography>

        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <Pressable key={index} onPress={() => toggle(index)} style={styles.item}>
              <View style={styles.questionRow}>
                <Typography variant="bodyBold" baseFontSize={14} style={styles.question}>
                  {item.question}
                </Typography>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Colors.textMuted}
                />
              </View>
              {isOpen && (
                <Typography variant="body" baseFontSize={13} baseLineHeight={20} color={Colors.textSecondary} style={styles.answer}>
                  {item.answer}
                </Typography>
              )}
            </Pressable>
          );
        })}
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
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  item: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 16,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  question: {
    flex: 1,
    color: Colors.textPrimary,
  },
  answer: {
    marginTop: 10,
  },
});
