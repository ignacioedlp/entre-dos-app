import moment from "moment";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { CardHistoryItem } from "../../lib/api";
import {
  Colors,
  RarityKey,
  rarityColor,
  rarityGlow,
} from "../../constants/colors";

const RARITY_MAP: Record<string, RarityKey> = {
  common: "comun",
  rare: "rara",
  epic: "epica",
  legendary: "legendaria",
};

interface WeekTimelineProps {
  plays: CardHistoryItem[];
  isLoading: boolean;
  currentUserId: string;
}

function SkeletonRow() {
  return (
    <View style={styles.row}>
      <View style={styles.leftCol}>
        <View style={[styles.dot, { backgroundColor: Colors.border }]} />
        <View style={styles.lineSegment} />
      </View>
      <View style={[styles.rightCol, { gap: 6, paddingBottom: 20 }]}>
        <View
          style={{
            width: 120,
            height: 10,
            borderRadius: 4,
            backgroundColor: Colors.surfaceAlt,
          }}
        />
        <View
          style={{
            width: 180,
            height: 14,
            borderRadius: 4,
            backgroundColor: Colors.surfaceAlt,
          }}
        />
        <View
          style={{
            width: 100,
            height: 10,
            borderRadius: 4,
            backgroundColor: Colors.surfaceAlt,
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
}: {
  play: CardHistoryItem;
  isLast: boolean;
  currentUserId: string;
}) {
  const { t } = useTranslation(["home", "common"]);
  const rarity = RARITY_MAP[play.rarity] ?? "comun";
  const dotColor = rarityColor[rarity];
  const dotGlow = rarityGlow[rarity];
  const isMine = play.userId === currentUserId;
  const playerLabel = isMine
    ? t("home:weekTimeline.you")
    : (play.userName ?? t("home:weekTimeline.partner"));
  const timeStr = moment(play.playedAt).format("MMM D · HH:mm");

  const categoryLabel = t(`common:category.${play.category}`, {
    defaultValue: play.category.toUpperCase(),
  });
  const rarityLabel = t(`common:rarity.${play.rarity}`, {
    defaultValue: play.rarity.toUpperCase(),
  });

  return (
    <View style={styles.row}>
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
          <Text style={styles.timeText}>{timeStr}</Text>
          <Text style={styles.metaSep}> · </Text>
          <Text style={[styles.playerText, isMine && styles.playerTextMine]}>
            {playerLabel}
          </Text>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{categoryLabel}</Text>
          </View>
          <View style={[styles.badge, { borderColor: dotColor + "55" }]}>
            <Text style={[styles.badgeText, { color: dotColor }]}>
              {rarityLabel}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {play.title}
        </Text>

        {play.description ? (
          <Text style={styles.noteText} numberOfLines={3}>
            "{play.description}"
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function WeekTimeline({
  plays,
  isLoading,
  currentUserId,
}: WeekTimelineProps) {
  const { t } = useTranslation("home");

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("weekTimeline.title")}</Text>
        {!isLoading && plays.length > 0 && (
          <Text style={styles.sectionCount}>
            {t("weekTimeline.played", { count: plays.length })}
          </Text>
        )}
      </View>

      <View style={styles.divider} />

      {isLoading ? (
        <>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </>
      ) : plays.length === 0 ? (
        <Text style={styles.emptyText}>{t("weekTimeline.empty")}</Text>
      ) : (
        plays.map((play, i) => (
          <TimelineEntry
            key={play.id}
            play={play}
            isLast={i === plays.length - 1}
            currentUserId={currentUserId}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    marginTop: 36,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Inter_900Black",
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    color: Colors.textMuted,
  },
  sectionCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 20,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: 24,
  },
  row: {
    flexDirection: "row",
  },
  leftCol: {
    width: 28,
    alignItems: "center",
    paddingTop: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  lineSegment: {
    flex: 1,
    width: 1,
    backgroundColor: Colors.border,
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
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  timeText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: "capitalize",
  },
  metaSep: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  playerText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  playerTextMine: {
    color: Colors.accent,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
  },
  badge: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: "Inter_900Black",
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: Colors.textMuted,
  },
  cardTitle: {
    fontFamily: "Inter_900Black",
    fontSize: 15,
    letterSpacing: -0.3,
    textTransform: "uppercase",
    color: Colors.textPrimary,
    lineHeight: 19,
    marginTop: 2,
  },
  noteText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginTop: 2,
  },
});
