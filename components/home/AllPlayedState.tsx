import { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

import { useColors } from '@/context/ThemeContext';
import { Typography } from '../ui/Typography';

function getNextMondayUTC(): moment.Moment {
  const now = moment.utc();
  const dayOfWeek = now.isoWeekday();
  const daysUntil = dayOfWeek === 1 ? 7 : 8 - dayOfWeek;
  return moment.utc().startOf('day').add(daysUntil, 'days');
}

function formatCountdown(target: moment.Moment): string {
  const now = moment.utc();
  const diff = target.diff(now);
  if (diff <= 0) return '00:00:00';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0)
    return `${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function AllPlayedState() {
  const nextMonday = useMemo(() => getNextMondayUTC(), []);
  const [countdown, setCountdown] = useState(() => formatCountdown(nextMonday));
  const { t } = useTranslation('home');
  const colors = useColors();

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(formatCountdown(nextMonday));
    }, 1000);
    return () => clearInterval(id);
  }, [nextMonday]);

  return (
    <View style={styles.empty}>
      <Typography variant="heading" baseFontSize={48} style={styles.emoji}>
        🎉
      </Typography>
      <Typography variant="swissTitle" style={styles.emptyTitle}>
        {t('allPlayed.title')}
      </Typography>
      <Typography
        variant="body"
        baseFontSize={15}
        baseLineHeight={22}
        color={colors.textSecondary}
        style={styles.emptyBody}
      >
        {t('allPlayed.body')}
      </Typography>
      <View style={styles.countdownBox}>
        <Typography
          variant="cardLabel"
          color={colors.textMuted}
          style={{ opacity: 1, letterSpacing: 2 }}
        >
          {t('allPlayed.countdown')}
        </Typography>
        <Typography variant="heading" baseFontSize={36} style={styles.countdownValue}>
          {countdown}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  emoji: {
    marginBottom: 8,
    textTransform: 'none',
    letterSpacing: 0,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyBody: {
    textAlign: 'center',
    maxWidth: 280,
  },
  countdownBox: {
    minWidth: 320,
    marginTop: 20,
    alignItems: 'center',
    gap: 6,
  },
  countdownValue: {
    letterSpacing: -1,
  },
});
