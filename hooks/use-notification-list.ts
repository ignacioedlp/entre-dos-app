import { NotificationItem } from "@/components/notifications/notification-card";
import { ApiNotification, fetchNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import i18n from "@/i18n";

function parseApiDate(dateStr: string): Date {
  return moment.utc(dateStr).toDate();
}

type TFunction = (key: string, opts?: Record<string, string>) => string;

function formatTime(dateStr: string, t?: TFunction): string {
  const date = parseApiDate(dateStr);
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  const yesterdayStr = yesterdayDate.toDateString();
  const notifDateStr = date.toDateString();

  const hhmm = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (notifDateStr === todayStr) return hhmm;
  if (notifDateStr === yesterdayStr) return i18n.t("notifications:buckets.yesterday");
  return date.toLocaleDateString();
}

function getBucket(dateStr: string): "today" | "yesterday" | "earlier" {
  const date = parseApiDate(dateStr);
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  const yesterdayStr = yesterdayDate.toDateString();
  const notifDateStr = date.toDateString();

  if (notifDateStr === todayStr) return "today";
  if (notifDateStr === yesterdayStr) return "yesterday";
  return "earlier";
}

interface UseNotificationListResult {
  isLoading: boolean;
  error: string | null;
  hasUnread: boolean;
  groups: { title: string; items: NotificationItem[] }[];
  refresh: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export function useNotificationList(): UseNotificationListResult {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function groupNotifications(data: ApiNotification[]) {
    const buckets: Record<string, NotificationItem[]> = {
      today: [],
      yesterday: [],
      earlier: [],
    };

    for (const n of data) {
      const bucket = getBucket(n.createdAt);
      buckets[bucket].push({
        id: n.id,
        category: n.category,
        title: n.title,
        message: n.body,
        time: formatTime(n.createdAt),
        read: n.readAt !== null,
        data: n.data,
      });
    }

    return (["today", "yesterday", "earlier"] as const)
      .filter((key) => buckets[key].length > 0)
      .map((key) => ({ title: key, items: buckets[key] }));
  }

  const groups = groupNotifications(notifications);
  const hasUnread = notifications.some((n) => !n.readAt);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications();
      setNotifications(data.notifications);
    } catch {
      setError("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = useCallback(
    async (id: string) => {
      const numId = id;
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === numId
            ? { ...n, read: true, readAt: new Date().toISOString() }
            : n,
        ),
      );
      try {
        await markNotificationRead(numId);
      } catch {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === numId ? { ...n, read: false, readAt: null } : n,
          ),
        );
      }
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, readAt: n.readAt ?? now })),
    );
    try {
      await markAllNotificationsRead();
    } catch {
      load();
    }
  }, [load]);

  return { isLoading, error, hasUnread, groups, refresh: load, markRead, markAllRead };
}