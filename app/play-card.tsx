import { useRef, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from 'toastify-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { RarityKey, rarityColor, ThemeColors } from '../constants/colors';
import { useColors } from '../context/ThemeContext';
import { DeckCard, DeckResponse, apiPlayCard } from '../lib/api';
import { SwipeToConfirm } from '../components/ui/SwipeToConfirm';
import { Typography } from '../components/ui/Typography';

const RARITY_MAP: Record<string, RarityKey> = {
  common: 'comun',
  rare: 'rara',
  epic: 'epica',
  legendary: 'legendaria',
};

export default function CardDetailSheet() {
  const { data } = useLocalSearchParams<{ data: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const playing = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [confirmAttempt, setConfirmAttempt] = useState(0);
  const { t } = useTranslation('home');
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  async function handleConfirm(cardId: string) {
    if (playing.current) return;
    playing.current = true;
    setIsPlaying(true);
    try {
      const play = await apiPlayCard(cardId);
      queryClient.setQueryData<DeckResponse>(['deck'], (old) => {
        if (!old) return old;
        return {
          ...old,
          cards: old.cards.map((c) => (c.id === cardId ? { ...c, status: 'played' as const } : c)),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['deck-history'] });
      Toast.success(t('playCard.success'));
      router.replace({ pathname: '/play-thread', params: { playId: play.id } });
    } catch {
      playing.current = false;
      setIsPlaying(false);
      setConfirmAttempt((attempt) => attempt + 1);
      Toast.error(t('playCard.errorSave'));
    }
  }

  let card: DeckCard | null = null;
  try {
    if (data) card = JSON.parse(decodeURIComponent(data));
  } catch {
    // ignore parse errors
  }

  if (!card) {
    return (
      <View
        style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
      >
        <Typography
          variant="body"
          baseFontSize={15}
          color={colors.textSecondary}
          style={styles.errorText}
        >
          {t('playCard.errorLoad')}
        </Typography>
      </View>
    );
  }

  const rarity = RARITY_MAP[card.rarity] ?? 'comun';
  const cardBg = rarityColor[rarity];
  const isPlayed = card.status === 'played';

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.header}>
        <Typography variant="heading" baseFontSize={24} baseLineHeight={28} style={styles.title}>
          {t('playCard.title')}
        </Typography>
        <Typography variant="body" baseFontSize={14} baseLineHeight={20}>
          {t('playCard.description')}
        </Typography>
      </View>

      <View style={styles.body}>
        <Typography
          variant="swissTitle"
          baseFontSize={32}
          baseLineHeight={34}
          color={cardBg}
          style={styles.cardTitle}
        >
          {card.title}
        </Typography>
        <Typography
          variant="body"
          baseFontSize={12}
          baseLineHeight={18}
          style={styles.cardDescription}
        >
          {card.description}
        </Typography>
      </View>

      <View style={styles.footer}>
        {isPlayed ? (
          <View style={styles.playedBanner}>
            <Typography variant="bodyBold" baseFontSize={15} color={colors.textSecondary}>
              {t('playCard.played')}
            </Typography>
          </View>
        ) : (
          <SwipeToConfirm
            key={confirmAttempt}
            onConfirm={() => handleConfirm(card.id)}
            disabled={isPlaying}
            label={isPlaying ? t('playCard.saving') : undefined}
          />
        )}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    title: {
      letterSpacing: -0.5,
    },
    header: {
      paddingHorizontal: 24,
      gap: 20,
    },
    body: {
      paddingHorizontal: 24,
      paddingTop: 24,
      gap: 10,
      flex: 1,
    },
    cardTitle: {
      letterSpacing: -0.5,
    },
    cardDescription: {
      textTransform: 'uppercase',
    },
    footer: {
      paddingHorizontal: 24,
      gap: 12,
    },
    playedBanner: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    errorText: {
      textAlign: 'center',
      marginTop: 40,
    },
  });
}
