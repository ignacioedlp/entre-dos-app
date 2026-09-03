import { useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { rarityColor, rarityTextColor, RarityKey } from '../constants/colors';
import { CategoryWatermark } from '../components/cards/CategoryWatermark';
import { GameCard } from '../components/cards/GameCard';
import { Button } from '../components/ui/Button';
import { Typography } from '../components/ui/Typography';
import { useColors } from '../context/ThemeContext';
import { useRevenueCat } from '../context/RevenueCatContext';
import {
  apiCreateCustomCard,
  apiGetCustomCards,
  apiGetEntitlements,
  apiSetCustomCardActive,
  apiUpdateCustomCard,
  CardCategory,
  CardRarity,
  CustomCard,
  CustomCardInput,
} from '../lib/api';
import { Toast } from 'toastify-react-native';

const EMPTY_FORM: CustomCardInput = {
  title: '',
  description: '',
  category: 'date',
  rarity: 'common',
};
const CATEGORIES: CardCategory[] = ['date', 'action', 'home'];
const RARITIES: CardRarity[] = ['common', 'rare', 'legendary'];
const TITLE_MAX_LENGTH = 40;
const DESCRIPTION_MAX_LENGTH = 120;
const GRID_GAP = 12;
const GRID_PADDING = 24;
const RARITY_UI_MAP: Record<CardRarity, RarityKey> = {
  common: 'comun',
  rare: 'rara',
  legendary: 'legendaria',
};
const DEFAULT_RARITY_LIMITS: Record<CardRarity, number> = {
  common: 12,
  rare: 7,
  legendary: 1,
};

function errorMessage(error: unknown, fallback: string) {
  const response = error as { response?: { data?: { error?: string } } };
  return response.response?.data?.error || fallback;
}

function CustomCardsSkeleton({
  cardWidth,
  styles,
}: {
  cardWidth: number;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <ScrollView
      accessibilityLabel="Cargando mis cartas"
      contentContainerStyle={styles.skeletonContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.skeletonLine, styles.skeletonCount]} />
      <View style={styles.skeletonGrid}>
        {[0, 1, 2, 3].map((index) => (
          <View key={index} style={[styles.skeletonCard, { width: cardWidth }]}>
            <View style={[styles.skeletonLine, styles.skeletonCardLabel]} />
            <View style={[styles.skeletonLine, styles.skeletonCardTitle]} />
            <View style={[styles.skeletonLine, styles.skeletonCardWatermark]} />
            <View style={[styles.skeletonLine, styles.skeletonCardDescription]} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default function CustomCardsScreen() {
  const { t } = useTranslation('home');
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isSubscribed, entitlementData } = useRevenueCat();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CustomCard | null>(null);
  const [form, setForm] = useState<CustomCardInput>(EMPTY_FORM);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: entitlements, isLoading: entitlementsLoading } = useQuery({
    queryKey: ['entitlements'],
    queryFn: apiGetEntitlements,
  });
  const isPremium =
    isSubscribed || entitlementData?.premium === true || entitlements?.premium === true;
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['custom-cards'],
    queryFn: apiGetCustomCards,
    enabled: isPremium,
  });

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };
  const save = useMutation({
    mutationFn: () => (editing ? apiUpdateCustomCard(editing.id, form) : apiCreateCustomCard(form)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['custom-cards'] });
      closeEditor();
      Toast.success(t('customCards.saved'));
    },
    onError: (error) => Toast.error(errorMessage(error, t('customCards.error'))),
  });
  const setActive = useMutation({
    mutationFn: ({ cardId, isActive }: { cardId: string; isActive: boolean }) =>
      apiSetCustomCardActive(cardId, isActive),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['custom-cards'] }),
    onError: (error) => Toast.error(errorMessage(error, t('customCards.error'))),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  };
  const openEdit = (card: CustomCard) => {
    setEditing(card);
    setForm({
      title: card.title,
      description: card.description,
      category: card.category,
      rarity: card.rarity,
    });
    setEditorOpen(true);
  };
  const openCardActions = (card: CustomCard) => {
    const actions = [] as {
      text: string;
      style?: 'cancel';
      onPress?: () => void;
    }[];
    if (card.canEdit) {
      actions.push({ text: t('customCards.edit'), onPress: () => openEdit(card) });
      actions.push({
        text: card.isActive ? t('customCards.deactivate') : t('customCards.reactivate'),
        onPress: () => setActive.mutate({ cardId: card.id, isActive: !card.isActive }),
      });
    }
    actions.push({ text: t('common:cancel'), style: 'cancel' });
    Alert.alert(card.title, t('customCards.cardOptions'), actions);
  };
  const activeCards = data?.cards.filter((card) => card.isActive && !card.isArchived) ?? [];
  const activeRarityCounts = activeCards.reduce<Record<CardRarity, number>>(
    (counts, card) => ({ ...counts, [card.rarity]: counts[card.rarity] + 1 }),
    { common: 0, rare: 0, legendary: 0 }
  );
  const rarityCountWithoutEditedCard = (rarity: CardRarity) =>
    activeRarityCounts[rarity] -
    (editing?.isActive && !editing.isArchived && editing.rarity === rarity ? 1 : 0);
  const isRarityUnavailable = (rarity: CardRarity) =>
    rarityCountWithoutEditedCard(rarity) >=
    (data?.rarityLimits[rarity] ?? DEFAULT_RARITY_LIMITS[rarity]);
  const descriptionRemaining = DESCRIPTION_MAX_LENGTH - form.description.length;
  const canSave =
    form.title.trim().length > 0 &&
    form.title.length <= TITLE_MAX_LENGTH &&
    form.description.trim().length > 0 &&
    descriptionRemaining >= 0;
  const cardWidth = (width - GRID_PADDING * 2 - GRID_GAP) / 2;
  const showSkeleton =
    (entitlementsLoading && !isSubscribed && entitlementData?.premium !== true) ||
    (isPremium && isLoading);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common:back')}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.background} />
        </Pressable>
        <Typography variant="heading">{t('customCards.title')}</Typography>
      </View>
      <Typography variant="body" color={colors.textSecondary} style={styles.subtitle}>
        {t('customCards.subtitle')}
      </Typography>

      {showSkeleton ? (
        <CustomCardsSkeleton cardWidth={cardWidth} styles={styles} />
      ) : !isPremium ? (
        <View style={styles.empty}>
          <Ionicons name="lock-closed-outline" size={36} color={colors.textMuted} />
          <Typography variant="body" color={colors.textSecondary} style={styles.centered}>
            {t('customCards.premium')}
          </Typography>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.accent}
            />
          }
        >
          <View style={styles.countRow}>
            <Typography variant="label" color={colors.textSecondary}>
              {t('customCards.count', { count: activeCards.length, limit: data?.limit ?? 20 })}
            </Typography>
          </View>
          {data?.cards.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="sparkles-outline" size={38} color={colors.textMuted} />
              <Typography variant="body" color={colors.textSecondary} style={styles.centered}>
                {t('customCards.empty')}
              </Typography>
            </View>
          ) : null}
          <View style={styles.grid}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('customCards.add')}
              disabled={activeCards.length >= (data?.limit ?? 20)}
              onPress={openCreate}
              style={({ pressed }) => [
                styles.addCard,
                { width: cardWidth },
                pressed && styles.pressed,
                activeCards.length >= (data?.limit ?? 20) && styles.disabled,
              ]}
            >
              <Ionicons name="add" size={30} color={colors.textSecondary} />
              <Typography variant="button" color={colors.textSecondary}>
                {t('customCards.addCard')}
              </Typography>
            </Pressable>
            {data?.cards.map((card) => {
              const rarity = RARITY_UI_MAP[card.rarity];
              return (
                <Pressable
                  key={card.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${card.title}. ${t(`customCards.categories.${card.category}`)}`}
                  accessibilityHint={t('customCards.cardActionHint')}
                  onPress={() => openCardActions(card)}
                  style={({ pressed }) => [
                    styles.gridCard,
                    { width: cardWidth },
                    (!card.isActive || card.isArchived) && styles.inactiveCard,
                    pressed && styles.pressed,
                  ]}
                >
                  <GameCard
                    card={{
                      rarity,
                      category: card.category,
                      label: t(`customCards.categories.${card.category}`),
                      title: card.title,
                      description: card.description,
                    }}
                    width={cardWidth}
                    variant="thumbnail"
                  />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={editorOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeEditor}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modal}
        >
          <ScrollView
            contentContainerStyle={styles.modalContent}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <Typography variant="heading" baseFontSize={24}>
                {editing ? t('customCards.edit') : t('customCards.add')}
              </Typography>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common:close')}
                onPress={() => {
                  Keyboard.dismiss();
                  closeEditor();
                }}
              >
                <Ionicons name="close" size={26} color={colors.textPrimary} />
              </Pressable>
            </View>
            <Typography variant="label" color={colors.textSecondary}>
              {t('customCards.fieldTitle')}
            </Typography>
            <TextInput
              value={form.title}
              onChangeText={(title) => setForm({ ...form, title })}
              maxLength={TITLE_MAX_LENGTH}
              onSubmitEditing={Keyboard.dismiss}
              returnKeyType="done"
              placeholder={t('customCards.titlePlaceholder')}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <Typography variant="label" color={colors.textSecondary}>
              {t('customCards.fieldDescription')}
            </Typography>
            <TextInput
              value={form.description}
              onChangeText={(description) => setForm({ ...form, description })}
              maxLength={DESCRIPTION_MAX_LENGTH}
              multiline
              onSubmitEditing={Keyboard.dismiss}
              returnKeyType="done"
              submitBehavior="blurAndSubmit"
              placeholder={t('customCards.descriptionPlaceholder')}
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.descriptionInput]}
            />
            <Typography variant="caption" color={colors.textMuted} style={styles.characterCounter}>
              {descriptionRemaining >= 0
                ? t('customCards.descriptionRemaining', { count: descriptionRemaining })
                : t('customCards.descriptionOverLimit', { count: Math.abs(descriptionRemaining) })}
            </Typography>
            <Typography variant="label" color={colors.textSecondary}>
              {t('customCards.fieldCategory')}
            </Typography>
            <View style={styles.categories}>
              {CATEGORIES.map((category) => (
                <Pressable
                  key={category}
                  accessibilityRole="button"
                  onPress={() => {
                    Keyboard.dismiss();
                    setForm({ ...form, category });
                  }}
                  style={[styles.category, form.category === category && styles.categorySelected]}
                >
                  <View style={styles.categoryContent}>
                    <CategoryWatermark
                      category={category}
                      color={form.category === category ? '#fff' : colors.textSecondary}
                      size={15}
                    />
                    <Typography
                      variant="label"
                      color={form.category === category ? '#fff' : colors.textSecondary}
                    >
                      {t(`customCards.categories.${category}`)}
                    </Typography>
                  </View>
                </Pressable>
              ))}
            </View>
            <Typography variant="label" color={colors.textSecondary}>
              {t('customCards.fieldRarity')}
            </Typography>
            <View style={styles.rarities}>
              {RARITIES.map((rarity) => {
                const rarityKey = RARITY_UI_MAP[rarity];
                const limit = data?.rarityLimits[rarity] ?? DEFAULT_RARITY_LIMITS[rarity];
                const unavailable = isRarityUnavailable(rarity) && form.rarity !== rarity;
                return (
                  <Pressable
                    key={rarity}
                    accessibilityRole="button"
                    accessibilityLabel={t('common:rarity.' + rarity)}
                    disabled={unavailable}
                    onPress={() => {
                      Keyboard.dismiss();
                      setForm({ ...form, rarity });
                    }}
                    style={[
                      styles.rarity,
                      { borderColor: rarityColor[rarityKey] },
                      form.rarity === rarity && { backgroundColor: rarityColor[rarityKey] },
                      unavailable && styles.rarityDisabled,
                    ]}
                  >
                    <Typography
                      variant="label"
                      baseFontSize={11}
                      color={
                        form.rarity === rarity ? rarityTextColor[rarityKey] : colors.textSecondary
                      }
                    >
                      {t('customCards.rarityCount', {
                        rarity: t('common:rarity.' + rarity),
                        count: activeRarityCounts[rarity],
                        limit,
                      })}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>
            <Button
              label={save.isPending ? t('customCards.saving') : t('customCards.save')}
              onPress={() => {
                Keyboard.dismiss();
                save.mutate();
              }}
              disabled={!canSave || save.isPending}
              style={styles.saveButton}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      gap: 20,
      paddingVertical: 14,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 25,
      backgroundColor: colors.textPrimary,
    },
    subtitle: { paddingHorizontal: 20, marginTop: 2, marginBottom: 20 },
    content: { padding: 24, gap: 12, paddingBottom: 44 },
    skeletonContent: { padding: 24, gap: 12, paddingBottom: 44 },
    skeletonLine: { borderRadius: 6, backgroundColor: colors.surfaceAlt },
    skeletonCount: { width: 168, height: 16, marginBottom: 4 },
    skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
    skeletonCard: {
      aspectRatio: 3 / 4,
      borderRadius: 14,
      padding: 16,
      backgroundColor: colors.surface,
    },
    skeletonCardLabel: { width: '48%', height: 10 },
    skeletonCardTitle: { width: '76%', height: 18, marginTop: 12 },
    skeletonCardWatermark: {
      width: 58,
      height: 58,
      borderRadius: 29,
      alignSelf: 'center',
      marginTop: 30,
    },
    skeletonCardDescription: {
      width: '62%',
      height: 12,
      position: 'absolute',
      left: 16,
      bottom: 18,
    },
    countRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
    addCard: {
      aspectRatio: 3 / 4,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.textMuted,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    gridCard: {
      aspectRatio: 3 / 4,
    },
    inactiveCard: { opacity: 0.58 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 32 },
    centered: { textAlign: 'center' },
    modal: { flex: 1, backgroundColor: colors.background },
    modalContent: { padding: 24, paddingTop: 32, paddingBottom: 44, gap: 10 },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    input: {
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      borderRadius: 14,
      padding: 14,
      fontSize: 16,
      marginBottom: 10,
    },
    descriptionInput: { minHeight: 132, textAlignVertical: 'top' },
    characterCounter: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 4 },
    categories: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    rarities: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 6 },
    category: {
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    categoryContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    categorySelected: { backgroundColor: colors.accent, borderColor: colors.accent },
    rarity: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9 },
    rarityDisabled: { opacity: 0.38 },
    saveButton: { marginTop: 18 },
    pressed: { opacity: 0.7 },
    disabled: { opacity: 0.4 },
  });
