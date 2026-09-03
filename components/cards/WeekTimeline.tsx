import moment from 'moment';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

import { CardHistoryItem } from '../../lib/api';
import { RarityKey, rarityColor, rarityGlow, ThemeColors } from '../../constants/colors';
import { useColors } from '../../context/ThemeContext';
import { Typography } from '../ui/Typography';

const RARITY_MAP: Record<string, RarityKey> = {
  common: 'comun',
  rare: 'rara',
  epic: 'epica',
  legendary: 'legendaria',
};

interface WeekTimelineProps {
  plays: CardHistoryItem[];
  isLoading: boolean;
  currentUserId: string;
}

function SkeletonRow({
  colors,
  styles,
}: {
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.leftCol}>
        <View style={[styles.dot, { backgroundColor: colors.border }]} />
        <View style={styles.lineSegment} />
      </View>
      <View style={[styles.rightCol, { gap: 6, paddingBottom: 20 }]}>
        <View
          style={{
            width: 120,
            height: 10,
            borderRadius: 4,
            backgroundColor: colors.surfaceAlt,
          }}
        />
        <View
          style={{
            width: 180,
            height: 14,
            borderRadius: 4,
            backgroundColor: colors.surfaceAlt,
          }}
        />
        <View
          style={{
            width: 100,
            height: 10,
            borderRadius: 4,
            backgroundColor: colors.surfaceAlt,
          }}
        />
      </View>
    </View>
  );
}

function TimelineEntry({
  play,
  isLast,
  currentUserId,
  colors,
  styles,
}: {
  play: CardHistoryItem;
  isLast: boolean;
  currentUserId: string;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  const { t } = useTranslation(['home', 'common']);
  const router = useRouter();
  const rarity = RARITY_MAP[play.rarity] ?? 'comun';
  const dotColor = rarityColor[rarity];
  const dotGlow = rarityGlow[rarity];
  const isMine = play.userId === currentUserId;
  const playerLabel = isMine
    ? t('home:weekTimeline.you')
    : (play.userName ?? t('home:weekTimeline.partner'));
  const timeStr = moment(play.playedAt).format('MMM D · HH:mm');

  const categoryLabel = t(`common:category.${play.category}`, {
    defaultValue: play.category.toUpperCase(),
  });
  const rarityLabel = t(`common:rarity.${play.rarity}`, {
    defaultValue: play.rarity.toUpperCase(),
  });

  return (
    <Pressable
      accessibilityLabel={t('home:playThread.openThread', { title: play.title })}
      onPress={() => router.push({ pathname: '/play-thread', params: { playId: play.id } })}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.leftCol}>
        <View
          style={[
            styles.dot,
            {
              backgroundColor: dotColor,
              shadowColor: dotGlow,
              shadowOpacity: 0.9,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 0 },
              elevation: 4,
            },
          ]}
        />
        {!isLast && <View style={styles.lineSegment} />}
      </View>

      <View style={[styles.rightCol, isLast ? styles.rightColLast : null]}>
        <View style={styles.metaRow}>
          <Typography
            variant="caption"
            color={colors.textMuted}
            style={{ textTransform: 'capitalize' }}
          >
            {timeStr}
          </Typography>
          <Typography variant="caption" color={colors.textMuted}>
            {' · '}
          </Typography>
          <Typography
            variant="caption"
            color={isMine ? colors.accent : colors.textSecondary}
            style={{ fontFamily: 'Inter_700Bold', fontWeight: '700' }}
          >
            {playerLabel}
          </Typography>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Typography
              variant="cardLabel"
              baseFontSize={9}
              style={{ opacity: 1, letterSpacing: 1.5 }}
              color={colors.textMuted}
            >
              {categoryLabel}
            </Typography>
          </View>
          <View style={[styles.badge, { borderColor: dotColor + '55' }]}>
            <Typography
              variant="cardLabel"
              baseFontSize={9}
              style={{ opacity: 1, letterSpacing: 1.5 }}
              color={dotColor}
            >
              {rarityLabel}
            </Typography>
          </View>
          {play.event && (
            <View style={[styles.badge, { borderColor: play.event.color + '55' }]}>
              <Typography
                variant="cardLabel"
                baseFontSize={9}
                style={{ opacity: 1, letterSpacing: 1.5 }}
                color={play.event.color}
              >
                {play.event.name}
              </Typography>
            </View>
          )}
        </View>

        <Typography
          variant="swissTitle"
          baseFontSize={15}
          baseLineHeight={19}
          color={colors.textPrimary}
          numberOfLines={2}
          style={styles.cardTitle}
        >
          {play.title}
        </Typography>

        {play.description ? (
          <Typography
            variant="body"
            baseFontSize={13}
            baseLineHeight={18}
            color={colors.textSecondary}
            numberOfLines={3}
            style={styles.noteText}
          >
            {'"'}
            {play.description}
            {'"'}
          </Typography>
        ) : null}
      </View>
    </Pressable>
  );
}

export function WeekTimeline({ plays, isLoading, currentUserId }: WeekTimelineProps) {
  const { t } = useTranslation('home');
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Typography
          variant="cardLabel"
          color={colors.textMuted}
          style={{ opacity: 1, letterSpacing: 2.5 }}
        >
          {t('weekTimeline.title')}
        </Typography>
        {!isLoading && plays.length > 0 && (
          <Typography variant="caption" color={colors.textSecondary}>
            {t('weekTimeline.played', { count: plays.length })}
          </Typography>
        )}
      </View>

      <View style={styles.divider} />

      {isLoading ? (
        <>
          <SkeletonRow colors={colors} styles={styles} />
          <SkeletonRow colors={colors} styles={styles} />
          <SkeletonRow colors={colors} styles={styles} />
        </>
      ) : plays.length === 0 ? (
        <Typography
          variant="body"
          baseFontSize={14}
          color={colors.textMuted}
          style={styles.emptyText}
        >
          {t('weekTimeline.empty')}
        </Typography>
      ) : (
        plays.map((play, i) => (
          <TimelineEntry
            key={play.id}
            play={play}
            isLast={i === plays.length - 1}
            currentUserId={currentUserId}
            colors={colors}
            styles={styles}
          />
        ))
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 24,
      paddingBottom: 48,
      marginTop: 36,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginBottom: 20,
    },
    emptyText: {
      textAlign: 'center',
      paddingVertical: 24,
    },
    row: {
      flexDirection: 'row',
    },
    rowPressed: {
      opacity: 0.72,
    },
    leftCol: {
      width: 28,
      alignItems: 'center',
      paddingTop: 2,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    lineSegment: {
      flex: 1,
      width: 2,
      backgroundColor: colors.textMuted,
      opacity: 0.55,
      marginTop: 4,
      marginBottom: 0,
    },
    rightCol: {
      flex: 1,
      paddingBottom: 24,
      gap: 4,
    },
    rightColLast: {
      paddingBottom: 0,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    badgeRow: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 2,
    },
    badge: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    cardTitle: {
      marginTop: 2,
      letterSpacing: -0.3,
    },
    noteText: {
      fontStyle: 'italic',
      marginTop: 2,
    },
  });
