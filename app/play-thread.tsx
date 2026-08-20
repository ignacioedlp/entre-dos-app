import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import moment from 'moment';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from 'toastify-react-native';

import { ThemeColors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/context/ThemeContext';
import {
  apiCreatePlayComment,
  apiDeletePlayReaction,
  apiDeletePlaySchedule,
  apiGetPlayThread,
  apiUpdatePlayReaction,
  apiUpdatePlaySchedule,
  PlayReaction,
  PlayReactionType,
  PlayThread,
} from '@/lib/api';
import { Typography } from '@/components/ui/Typography';

const REACTIONS: { type: PlayReactionType; emoji: string }[] = [
  { type: 'heart', emoji: '❤️' },
  { type: 'heart_eyes', emoji: '😍' },
  { type: 'laugh', emoji: '😂' },
  { type: 'fire', emoji: '🔥' },
  { type: 'raised_hands', emoji: '🙌' },
];

function newIdempotencyKey(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isoTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function PlayThreadScreen() {
  const { playId } = useLocalSearchParams<{ playId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const { t, i18n } = useTranslation('home');
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [draft, setDraft] = useState('');
  const draftKey = useRef<string | null>(null);
  const draftBody = useRef<string | null>(null);
  const commentInputRef = useRef<TextInput>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => new Date(Date.now() + 86400000));
  const [includeTime, setIncludeTime] = useState(false);

  const threadQuery = useQuery({
    queryKey: ['play-thread', playId],
    queryFn: () => apiGetPlayThread(playId!),
    enabled: Boolean(playId),
    refetchInterval: isFocused ? 5000 : false,
    refetchIntervalInBackground: false,
  });

  const refetchThread = threadQuery.refetch;

  useEffect(() => {
    if (isFocused && playId) refetchThread();
  }, [isFocused, playId, refetchThread]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && playId) refetchThread();
    });
    return () => subscription.remove();
  }, [playId, refetchThread]);

  const commentMutation = useMutation({
    mutationFn: ({ body, key }: { body: string; key: string }) =>
      apiCreatePlayComment(playId!, body, key),
    onSuccess: (comment) => {
      queryClient.setQueryData<PlayThread>(['play-thread', playId], (current) => {
        if (!current || current.comments.some((item) => item.id === comment.id)) return current;
        return { ...current, comments: [...current.comments, comment] };
      });
      setDraft('');
      draftKey.current = null;
      draftBody.current = null;
    },
    onError: () => Toast.error(t('playThread.commentError')),
  });

  const reactionMutation = useMutation<
    PlayReaction | null,
    Error,
    PlayReactionType | null,
    { previous?: PlayThread }
  >({
    mutationFn: async (type) => {
      if (type) return apiUpdatePlayReaction(playId!, type);
      await apiDeletePlayReaction(playId!);
      return null;
    },
    onMutate: async (type) => {
      await queryClient.cancelQueries({ queryKey: ['play-thread', playId] });
      const previous = queryClient.getQueryData<PlayThread>(['play-thread', playId]);
      queryClient.setQueryData<PlayThread>(['play-thread', playId], (current) => {
        if (!current || !user) return current;
        const withoutMine = current.reactions.filter(
          (reaction) => reaction.user.id !== user.userId
        );
        if (!type) return { ...current, reactions: withoutMine };
        const optimistic: PlayReaction = {
          id: `optimistic-${user.userId}`,
          type,
          user: {
            id: user.userId,
            displayName: user.displayName ?? '',
            avatarUrl: user.avatarUrl ?? '',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return { ...current, reactions: [...withoutMine, optimistic] };
      });
      return { previous };
    },
    onError: (_error, _type, context) => {
      queryClient.setQueryData(['play-thread', playId], context?.previous);
      Toast.error(t('playThread.reactionError'));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['play-thread', playId] }),
  });

  const scheduleMutation = useMutation({
    mutationFn: () =>
      apiUpdatePlaySchedule(playId!, {
        date: isoDate(scheduleDate),
        time: includeTime ? isoTime(scheduleDate) : null,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      }),
    onSuccess: (schedule) => {
      queryClient.setQueryData<PlayThread>(['play-thread', playId], (current) =>
        current ? { ...current, schedule } : current
      );
      setScheduleOpen(false);
    },
    onError: () => Toast.error(t('playThread.scheduleError')),
  });

  const removeScheduleMutation = useMutation({
    mutationFn: () => apiDeletePlaySchedule(playId!),
    onSuccess: () => {
      queryClient.setQueryData<PlayThread>(['play-thread', playId], (current) =>
        current ? { ...current, schedule: null } : current
      );
      setScheduleOpen(false);
    },
    onError: () => Toast.error(t('playThread.scheduleRemoveError')),
  });

  function sendComment() {
    const body = draft.trim();
    if (!body || body.length > 500 || commentMutation.isPending) return;
    if (!draftKey.current || draftBody.current !== body) {
      draftKey.current = newIdempotencyKey();
      draftBody.current = body;
    }
    commentMutation.mutate({ body, key: draftKey.current });
  }

  function openSchedule() {
    commentInputRef.current?.blur();
    const scheduled = threadQuery.data?.schedule;
    if (scheduled) {
      setScheduleDate(new Date(scheduled.scheduledAt));
      setIncludeTime(scheduled.hasTime);
    } else {
      setScheduleDate(new Date(Date.now() + 86400000));
      setIncludeTime(false);
    }
    setScheduleOpen(true);
  }

  function closeSchedule() {
    setScheduleOpen(false);
  }

  function formatSchedule(thread: PlayThread): string {
    if (!thread.schedule) return t('playThread.scheduleEmpty');
    const options: Intl.DateTimeFormatOptions = thread.schedule.hasTime
      ? { dateStyle: 'medium', timeStyle: 'short' }
      : { dateStyle: 'medium' };
    return new Intl.DateTimeFormat(i18n.language, options).format(
      new Date(thread.schedule.scheduledAt)
    );
  }

  const thread = threadQuery.data;
  const myReaction = thread?.reactions.find((reaction) => reaction.user.id === user?.userId);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { paddingTop: insets.top + 20 }]}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityLabel={t('playThread.back')}
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.background} />
        </Pressable>
        <Typography variant="heading" style={styles.headerTitle}>
          {t('playThread.title')}
        </Typography>
      </View>

      {threadQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.pasion} />
          <Typography variant="body" color={colors.textSecondary}>
            {t('playThread.loading')}
          </Typography>
        </View>
      ) : threadQuery.isError || !thread ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={42} color={colors.textMuted} />
          <Typography variant="body" color={colors.textSecondary} style={styles.centerText}>
            {t('playThread.loadError')}
          </Typography>
          <Pressable onPress={() => threadQuery.refetch()} style={styles.primaryButton}>
            <Typography variant="label" color="#FFFFFF">
              {t('playThread.retry')}
            </Typography>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.cardSummary}>
              <Typography variant="cardLabel" color={colors.pasion} style={styles.playedByLabel}>
                {t('playThread.playedBy', {
                  name: thread.playedBy.displayName || t('weekTimeline.partner'),
                })}
              </Typography>
              <Typography variant="swissTitle" baseFontSize={24} baseLineHeight={28}>
                {thread.card.title}
              </Typography>
              <Typography variant="body" color={colors.textSecondary}>
                {thread.card.description}
              </Typography>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="calendar-outline" size={18} color={colors.pasion} />
                  <Typography variant="bodyBold">{t('playThread.scheduleTitle')}</Typography>
                </View>
                <Pressable accessibilityRole="button" onPress={openSchedule}>
                  <Typography variant="label" color={colors.pasion}>
                    {thread.schedule ? t('playThread.change') : t('playThread.add')}
                  </Typography>
                </Pressable>
              </View>
              <Typography variant="body" color={colors.textSecondary}>
                {formatSchedule(thread)}
              </Typography>
            </View>

            <View style={styles.section}>
              <Typography variant="bodyBold">{t('playThread.reactionsTitle')}</Typography>
              <View style={styles.reactionRow}>
                {REACTIONS.map(({ type, emoji }) => {
                  const selected = myReaction?.type === type;
                  return (
                    <Pressable
                      key={type}
                      testID={`reaction-${type}`}
                      accessibilityLabel={t(`playThread.reactionLabels.${type}`)}
                      accessibilityState={{ selected }}
                      onPress={() => reactionMutation.mutate(selected ? null : type)}
                      style={[styles.reactionButton, selected && styles.reactionButtonSelected]}
                    >
                      <Text style={styles.emoji}>{emoji}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {thread.reactions.length > 0 ? (
                <Typography variant="caption" color={colors.textMuted}>
                  {thread.reactions
                    .map((reaction) =>
                      t('playThread.reactedBy', {
                        emoji: REACTIONS.find((item) => item.type === reaction.type)?.emoji,
                        name: reaction.user.displayName || t('weekTimeline.partner'),
                      })
                    )
                    .join(' · ')}
                </Typography>
              ) : null}
            </View>

            <View style={styles.commentsHeader}>
              <Typography variant="bodyBold">{t('playThread.commentsTitle')}</Typography>
              <Typography variant="caption" color={colors.textMuted}>
                {thread.comments.length}
              </Typography>
            </View>
            {thread.comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <Ionicons name="chatbubble-ellipses-outline" size={32} color={colors.textMuted} />
                <Typography variant="body" color={colors.textSecondary} style={styles.centerText}>
                  {t('playThread.commentsEmpty')}
                </Typography>
              </View>
            ) : (
              <View style={styles.comments}>
                {thread.comments.map((comment) => {
                  const mine = comment.author.id === user?.userId;
                  return (
                    <View
                      key={comment.id}
                      style={[styles.commentBubble, mine && styles.commentBubbleMine]}
                    >
                      <View style={styles.commentMeta}>
                        <Typography
                          variant="caption"
                          color={mine ? 'rgba(255, 255, 255, 0.82)' : colors.textMuted}
                        >
                          {mine
                            ? t('weekTimeline.you')
                            : comment.author.displayName || t('weekTimeline.partner')}
                        </Typography>
                        <Typography
                          variant="caption"
                          color={mine ? 'rgba(255, 255, 255, 0.72)' : colors.textMuted}
                        >
                          {moment(comment.createdAt).format('D MMM · HH:mm')}
                        </Typography>
                      </View>
                      <Typography
                        variant="body"
                        baseFontSize={14}
                        baseLineHeight={20}
                        color={mine ? '#FFFFFF' : colors.textPrimary}
                      >
                        {comment.body}
                      </Typography>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.inputShell}>
              <TextInput
                ref={commentInputRef}
                testID="play-comment-input"
                accessibilityLabel={t('playThread.commentPlaceholder')}
                multiline
                maxLength={500}
                placeholder={t('playThread.commentPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={draft}
                onChangeText={(value) => {
                  setDraft(value);
                  if (value.trim() !== draftBody.current) {
                    draftKey.current = null;
                    draftBody.current = null;
                  }
                }}
                style={[styles.input, { color: colors.textPrimary }]}
              />
              <Typography
                variant="caption"
                color={draft.length >= 480 ? colors.pasion : colors.textMuted}
              >
                {draft.length}/500
              </Typography>
            </View>
            <Pressable
              accessibilityLabel={t('playThread.send')}
              disabled={!draft.trim() || commentMutation.isPending}
              onPress={sendComment}
              style={[
                styles.sendButton,
                (!draft.trim() || commentMutation.isPending) && styles.buttonDisabled,
              ]}
            >
              {commentMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </>
      )}

      <Modal
        allowSwipeDismissal={Platform.OS === 'ios'}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
        transparent={Platform.OS !== 'ios'}
        visible={scheduleOpen}
        onRequestClose={closeSchedule}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common:close')}
            onPress={closeSchedule}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.modalCard,
              Platform.OS === 'ios' && styles.modalCardPageSheet,
              { paddingBottom: insets.bottom + 16 },
            ]}
          >
            <View style={styles.modalDragArea}>
              <View style={styles.modalHandle} />
            </View>
            <View style={styles.modalTitleRow}>
              <Typography variant="swissTitle" baseFontSize={21}>
                {t('playThread.scheduleModalTitle')}
              </Typography>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common:close')}
                hitSlop={8}
                onPress={closeSchedule}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={21} color={colors.textPrimary} />
              </Pressable>
            </View>
            <DateTimePicker
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={new Date()}
              mode="date"
              style={styles.datePicker}
              value={scheduleDate}
              onChange={(_event, value) => value && setScheduleDate(value)}
            />
            <View style={styles.timeToggle}>
              <View>
                <Typography variant="bodyBold">{t('playThread.includeTime')}</Typography>
                <Typography variant="caption" color={colors.textMuted}>
                  {t('playThread.includeTimeHint')}
                </Typography>
              </View>
              <Switch value={includeTime} onValueChange={setIncludeTime} />
            </View>
            {includeTime ? (
              <DateTimePicker
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                mode="time"
                style={styles.timePicker}
                value={scheduleDate}
                onChange={(_event, value) => value && setScheduleDate(value)}
              />
            ) : null}
            <Pressable
              disabled={scheduleMutation.isPending}
              onPress={() => scheduleMutation.mutate()}
              style={styles.primaryButton}
            >
              <Typography variant="label" color="#FFFFFF">
                {scheduleMutation.isPending ? t('playThread.saving') : t('playThread.save')}
              </Typography>
            </Pressable>
            {thread?.schedule ? (
              <Pressable
                disabled={removeScheduleMutation.isPending}
                onPress={() => removeScheduleMutation.mutate()}
                style={styles.removeButton}
              >
                <Typography variant="label" color={colors.pasion}>
                  {t('playThread.removeSchedule')}
                </Typography>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      gap: 20,
      paddingVertical: 14,
      marginBottom: 8,
    },
    headerTitle: { color: colors.textPrimary },
    iconButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      backgroundColor: colors.textPrimary,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingHorizontal: 40,
    },
    centerText: { textAlign: 'center' },
    content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 32 },
    cardSummary: {
      paddingHorizontal: 2,
      paddingTop: 12,
      paddingBottom: 24,
      gap: 8,
    },
    playedByLabel: { opacity: 1 },
    section: {
      paddingVertical: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    reactionRow: { flexDirection: 'row', gap: 10 },
    reactionButton: {
      width: 50,
      height: 50,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    reactionButtonSelected: { borderColor: colors.pasion, backgroundColor: `${colors.pasion}18` },
    emoji: {
      width: 38,
      height: 38,
      fontSize: 27,
      lineHeight: 38,
      textAlign: 'center',
      includeFontPadding: false,
    },
    commentsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 20,
      paddingBottom: 12,
    },
    emptyComments: { alignItems: 'center', gap: 10, paddingVertical: 28 },
    comments: { gap: 10 },
    commentBubble: {
      alignSelf: 'flex-start',
      maxWidth: '88%',
      minWidth: '44%',
      borderRadius: 16,
      padding: 12,
      gap: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    commentBubbleMine: {
      alignSelf: 'flex-end',
      backgroundColor: colors.pasion,
      borderColor: colors.pasion,
    },
    commentMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    inputShell: {
      flex: 1,
      minHeight: 48,
      maxHeight: 120,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: colors.surfaceAlt,
    },
    input: { flex: 1, minHeight: 24, maxHeight: 92, fontFamily: 'Inter_400Regular', fontSize: 14 },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.pasion,
    },
    buttonDisabled: { opacity: 0.4 },
    primaryButton: {
      minHeight: 46,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      backgroundColor: colors.pasion,
    },
    modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalCard: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      gap: 16,
      backgroundColor: colors.surface,
    },
    modalCardPageSheet: {
      flex: 1,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    },
    modalDragArea: {
      height: 20,
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginTop: -8,
    },
    modalHandle: {
      alignSelf: 'center',
      width: 44,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
    },
    modalTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    },
    modalCloseButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    datePicker: { width: '100%', alignSelf: 'center' },
    timePicker: { width: '100%', alignSelf: 'center' },
    timeToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    removeButton: { alignItems: 'center', justifyContent: 'center', minHeight: 42 },
  });
}
