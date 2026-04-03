import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import 'moment/locale/es';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';

import { useColors } from '@/context/ThemeContext';
import { ThemeColors } from '@/constants/colors';
import { apiGetCoupleStatus, apiUpdateCoupleAnniversary, apiUnlinkCouple } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import i18n from '@/i18n';
import { Typography } from '@/components/ui/Typography';
import { useScaledFontSize } from '@/context/FontScaleContext';

const AVATAR_SIZE = 80;
const DOT_COUNT = 7;

function AnimatedDot({
  opacity,
  styles,
}: {
  opacity: SharedValue<number>;
  styles: ReturnType<typeof createStyles>;
}) {
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.dot, style]} />;
}

export default function RelationshipScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('settings');
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const inputFontSize = useScaledFontSize(18);
  const separatorFontSize = useScaledFontSize(20);
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [editing, setEditing] = useState(false);
  const [unlinkVisible, setUnlinkVisible] = useState(false);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState<string | null>(null);

  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['couple-status'],
    queryFn: apiGetCoupleStatus,
  });

  const mutation = useMutation({
    mutationFn: apiUpdateCoupleAnniversary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couple-status'] });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: apiUnlinkCouple,
    onSuccess: () => {
      logout();
      router.replace('/(auth)/welcome');
    },
  });

  const couple = data?.couple;

  function startEditing() {
    setError(null);
    if (couple?.anniversary) {
      const m = moment(couple.anniversary);
      setDay(m.format('DD'));
      setMonth(m.format('MM'));
      setYear(m.format('YYYY'));
    } else {
      setDay('');
      setMonth('');
      setYear('');
    }
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError(null);
  }

  function handleDayChange(text: string) {
    const clean = text.replace(/\D/g, '');
    setDay(clean);
    if (clean.length === 2) monthRef.current?.focus();
  }

  function handleMonthChange(text: string) {
    const clean = text.replace(/\D/g, '');
    setMonth(clean);
    if (clean.length === 2) yearRef.current?.focus();
  }

  function handleYearChange(text: string) {
    setYear(text.replace(/\D/g, ''));
  }

  async function handleSave() {
    setError(null);

    if (!day || !month || !year || year.length < 4) {
      setError(t('relationship.errorRequired'));
      return;
    }

    const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const parsed = moment(dateStr, 'YYYY-MM-DD', true);

    if (!parsed.isValid()) {
      setError(t('relationship.errorInvalidDate'));
      return;
    }

    if (parsed.isAfter(moment(), 'day')) {
      setError(t('relationship.errorFutureDate'));
      return;
    }

    try {
      await mutation.mutateAsync(dateStr);
      setEditing(false);
    } catch {
      setError(t('relationship.errorInvalidDate'));
    }
  }

  async function handleRemove() {
    try {
      await mutation.mutateAsync(null);
      setEditing(false);
    } catch {
      // silently ignore
    }
  }

  // ── Animations ──────────────────────────────────────────────
  const heartScale = useSharedValue(1);
  const heartOpacity = useSharedValue(0.8);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const dotOpacities = Array.from({ length: DOT_COUNT }, () => useSharedValue(0.3));

  useEffect(() => {
    // Heart pulse
    heartScale.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 600, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.in(Easing.ease) })
      ),
      -1,
      false
    );
    heartOpacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 600 }), withTiming(0.8, { duration: 600 })),
      -1,
      false
    );

    // Dot wave animation — each dot lights up in sequence
    dotOpacities.forEach((dot, i) => {
      dot.value = withRepeat(
        withDelay(
          i * 120,
          withSequence(
            withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
            withTiming(0.3, { duration: 400, easing: Easing.in(Easing.ease) })
          )
        ),
        -1,
        false
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  const linkedDate = couple?.linkedAt
    ? moment(couple.linkedAt).locale(i18n.language).format('LL')
    : '';

  const anniversaryDate = couple?.anniversary
    ? moment(couple.anniversary).locale(i18n.language).format('LL')
    : null;

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 20 }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.background} />
        </Pressable>
        <Typography variant="heading" style={styles.headerTitle}>
          {t('relationship.title')}
        </Typography>
      </View>

      {isLoading && (
        <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: 60 }} />
      )}

      {couple && (
        <>
          {/* Partner Card */}
          <View style={styles.card}>
            <View style={styles.coupleRow}>
              {/* Left avatar + name */}
              <View style={styles.avatarCol}>
                {couple.userAImageUrl ? (
                  <Image source={{ uri: couple.userAImageUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={32} color={colors.textMuted} />
                  </View>
                )}
                <Typography
                  variant="bodyBold"
                  baseFontSize={14}
                  style={styles.name}
                  numberOfLines={1}
                >
                  {couple.userADisplayName ?? 'Partner'}
                </Typography>
              </View>

              {/* Animated connector: dots + heart */}
              <View style={styles.connector}>
                <View style={styles.dotsRow}>
                  {dotOpacities.slice(0, Math.floor(DOT_COUNT / 2)).map((dotOp, i) => (
                    <AnimatedDot key={`l-${i}`} opacity={dotOp} styles={styles} />
                  ))}
                  <Animated.View style={[styles.heartCenter, heartAnimStyle]}>
                    <Ionicons name="heart" size={22} color={colors.accent} />
                  </Animated.View>
                  {dotOpacities.slice(Math.ceil(DOT_COUNT / 2)).map((dotOp, i) => (
                    <AnimatedDot key={`r-${i}`} opacity={dotOp} styles={styles} />
                  ))}
                </View>
                <Typography
                  variant="body"
                  baseFontSize={11}
                  color={colors.textSecondary}
                  style={styles.since}
                >
                  {t('relationship.togetherSince', { date: linkedDate })}
                </Typography>
              </View>

              {/* Right avatar + name */}
              <View style={styles.avatarCol}>
                {couple.userBImageUrl ? (
                  <Image source={{ uri: couple.userBImageUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={32} color={colors.textMuted} />
                  </View>
                )}
                <Typography
                  variant="bodyBold"
                  baseFontSize={14}
                  style={styles.name}
                  numberOfLines={1}
                >
                  {couple.userBDisplayName ?? 'Partner'}
                </Typography>
              </View>
            </View>
          </View>

          {/* Anniversary Section */}
          <View style={styles.section}>
            <Typography variant="label" color={colors.textMuted} style={styles.sectionLabel}>
              {t('relationship.anniversary')}
            </Typography>

            {!editing ? (
              <View style={styles.anniversaryView}>
                {anniversaryDate ? (
                  <>
                    <View style={styles.dateDisplay}>
                      <Ionicons name="calendar" size={20} color={colors.accent} />
                      <Typography variant="bodyBold" baseFontSize={17}>
                        {anniversaryDate}
                      </Typography>
                    </View>
                    <Pressable onPress={startEditing} style={styles.editBtn}>
                      <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                      <Typography variant="body" baseFontSize={14} color={colors.textSecondary}>
                        {t('relationship.edit')}
                      </Typography>
                    </Pressable>
                  </>
                ) : (
                  <Pressable onPress={startEditing} style={styles.setDateBtn}>
                    <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
                    <Typography variant="bodyBold" color={colors.accent}>
                      {t('relationship.setDate')}
                    </Typography>
                  </Pressable>
                )}
              </View>
            ) : (
              <View style={styles.editContainer}>
                {/* Date Inputs */}
                <View style={styles.inputsRow}>
                  <TextInput
                    style={[styles.dateInput, { fontSize: inputFontSize }]}
                    value={day}
                    onChangeText={handleDayChange}
                    placeholder={t('relationship.day')}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                    textAlign="center"
                    autoFocus
                  />
                  <Typography
                    variant="bodyBold"
                    style={{ fontSize: separatorFontSize }}
                    color={colors.textMuted}
                  >
                    /
                  </Typography>
                  <TextInput
                    ref={monthRef}
                    style={[styles.dateInput, { fontSize: inputFontSize }]}
                    value={month}
                    onChangeText={handleMonthChange}
                    placeholder={t('relationship.month')}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                    textAlign="center"
                  />
                  <Typography
                    variant="bodyBold"
                    style={{ fontSize: separatorFontSize }}
                    color={colors.textMuted}
                  >
                    /
                  </Typography>
                  <TextInput
                    ref={yearRef}
                    style={[styles.dateInput, styles.yearInput, { fontSize: inputFontSize }]}
                    value={year}
                    onChangeText={handleYearChange}
                    placeholder={t('relationship.year')}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={4}
                    textAlign="center"
                  />
                </View>

                {error && (
                  <Typography
                    variant="body"
                    baseFontSize={13}
                    color={colors.accent}
                    style={{ textAlign: 'center' }}
                  >
                    {error}
                  </Typography>
                )}

                {/* Actions */}
                <Pressable
                  onPress={handleSave}
                  disabled={mutation.isPending}
                  style={({ pressed }) => [
                    styles.saveBtn,
                    pressed && { opacity: 0.8 },
                    mutation.isPending && { opacity: 0.5 },
                  ]}
                >
                  {mutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Typography variant="button" color="#ffffff">
                      {t('relationship.save')}
                    </Typography>
                  )}
                </Pressable>

                <View style={styles.secondaryActions}>
                  <Pressable onPress={cancelEditing} style={styles.textBtn}>
                    <Typography variant="body" baseFontSize={14} color={colors.textSecondary}>
                      {t('relationship.cancel')}
                    </Typography>
                  </Pressable>

                  {couple.anniversary && (
                    <Pressable
                      onPress={handleRemove}
                      disabled={mutation.isPending}
                      style={styles.textBtn}
                    >
                      <Typography variant="body" baseFontSize={14} color={colors.accent}>
                        {t('relationship.remove')}
                      </Typography>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Unlink Button */}
          <View style={styles.unlinkSection}>
            <Button
              label={t('relationship.unlink')}
              onPress={() => setUnlinkVisible(true)}
              variant="ghost"
            />
          </View>

          {/* Unlink Confirmation Modal */}
          <Modal
            visible={unlinkVisible}
            transparent
            animationType="fade"
            presentationStyle="overFullScreen"
            statusBarTranslucent
            onRequestClose={() => setUnlinkVisible(false)}
          >
            <View style={styles.backdrop}>
              <View style={styles.modalCard}>
                <View style={styles.iconWrap}>
                  <Ionicons name="heart-dislike-outline" size={28} color={colors.pasion} />
                </View>

                <Typography variant="heading" baseFontSize={20} style={styles.modalTitle}>
                  {t('relationship.unlinkConfirmTitle')}
                </Typography>
                <Typography
                  variant="body"
                  baseFontSize={14}
                  baseLineHeight={21}
                  color={colors.textSecondary}
                  style={styles.modalBody}
                >
                  {t('relationship.unlinkConfirmMessage')}
                </Typography>

                <View style={styles.modalActions}>
                  <Button
                    label={t('relationship.unlinkConfirm')}
                    onPress={() => unlinkMutation.mutate()}
                    variant="accent"
                    disabled={unlinkMutation.isPending}
                  />
                  <Button
                    label={t('relationship.cancel')}
                    onPress={() => setUnlinkVisible(false)}
                    variant="ghost"
                  />
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      gap: 20,
      paddingVertical: 14,
    },
    backBtn: {
      width: 40,
      backgroundColor: colors.textPrimary,
      height: 40,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 25,
    },
    headerTitle: {
      color: colors.textPrimary,
    },

    // Partner Card
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
      marginHorizontal: 20,
      marginTop: 24,
    },
    coupleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    avatarCol: {
      alignItems: 'center',
      gap: 10,
      width: AVATAR_SIZE + 10,
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      borderWidth: 2,
      borderColor: colors.border,
    },
    avatarPlaceholder: {
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: {
      textAlign: 'center',
    },
    connector: {
      flex: 1,
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 4,
    },
    dotsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: colors.accent,
    },
    heartCenter: {
      marginHorizontal: 4,
    },
    since: {
      textAlign: 'center',
    },

    // Anniversary Section
    section: {
      marginTop: 32,
      paddingHorizontal: 20,
    },
    sectionLabel: {
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 16,
    },
    anniversaryView: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      gap: 14,
    },
    dateDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
    },
    setDateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
    },

    // Edit Mode
    editContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      gap: 16,
    },
    inputsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    dateInput: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
      width: 56,
      fontFamily: 'Inter_700Bold',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    yearInput: {
      width: 80,
    },
    saveBtn: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 24,
    },
    textBtn: {
      paddingVertical: 4,
    },

    // Unlink
    unlinkSection: {
      marginTop: 40,
      paddingHorizontal: 20,
      marginBottom: 40,
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'flex-end',
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 28,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255,59,92,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      letterSpacing: -0.3,
      textAlign: 'center',
      marginBottom: 10,
    },
    modalBody: {
      textAlign: 'center',
      marginBottom: 28,
      maxWidth: 280,
    },
    modalActions: {
      width: '100%',
      gap: 10,
    },
  });
}
