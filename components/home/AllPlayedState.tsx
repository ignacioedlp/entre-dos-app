import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/colors';

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

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(formatCountdown(nextMonday));
    }, 1000);
    return () => clearInterval(id);
  }, [nextMonday]);

  return (
    <View style={styles.empty}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.emptyTitle}>{t('allPlayed.title')}</Text>
      <Text style={styles.emptyBody}>{t('allPlayed.body')}</Text>
      <View style={styles.countdownBox}>
        <Text style={styles.countdownLabel}>{t('allPlayed.countdown')}</Text>
        <Text style={styles.countdownValue}>{countdown}</Text>
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
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: 'Inter_900Black',
    fontSize: 22,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  countdownBox: {
    minWidth: 320,
    marginTop: 20,
    alignItems: 'center',
    gap: 6,
  },
  countdownLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  countdownValue: {
    fontFamily: 'Inter_900Black',
    fontSize: 36,
    letterSpacing: -1,
    color: Colors.textPrimary,
  },
});
