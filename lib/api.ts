import axios from 'axios';
import { clearAll, getToken, ProfileData } from './storage';

export const api = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_API_URL ??
    'https://discrete-interest-giant-environments.trycloudflare.com/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    // Axios normalizes headers to AxiosHeaders on native platforms. Using its
    // setter keeps the Authorization header intact on both iOS and Android.
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const authorization = error.config?.headers?.get?.('Authorization');

    // A 401 from a public/uncredentialed request must not erase an otherwise
    // valid locally persisted session. Only discard credentials that were
    // actually sent and rejected by the API.
    if (error.response?.status === 401 && authorization?.startsWith('Bearer ')) {
      clearAll();
    }
    return Promise.reject(error);
  }
);

export interface AuthResponse {
  accessToken: string;
  profile: ProfileData;
}

export interface CoupleStatus {
  linked: boolean;
  couple?: {
    coupleId: string;
    userAId: string;
    userADisplayName: string | null;
    userBId: string;
    userBDisplayName: string | null;
    userAImageUrl: string | null;
    userBImageUrl: string | null;
    linkedAt: string;
    anniversary: string | null;
  };
}

export interface LinkCoupleResponse {
  coupleId: string;
  linkedAt: string;
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/login', { email, password });
  return res.data;
}

export async function apiRegister(
  email: string,
  password: string,
  passwordConfirm: string,
  locale?: string
): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/register', {
    email,
    password,
    passwordConfirm,
    locale,
  });
  return res.data;
}

export async function apiGoogleAuth(idToken: string, locale: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/google', { idToken, locale });
  return res.data;
}

export async function apiForgotPassword(email: string): Promise<{ message: string }> {
  const res = await api.post<{ message: string }>('/auth/forgot-password', { email });
  return res.data;
}

export async function apiResetPassword(token: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/reset-password', { token, password });
  return res.data;
}

export async function apiGetCoupleStatus(): Promise<CoupleStatus> {
  const res = await api.get<CoupleStatus>('/couples/status');
  return res.data;
}

export async function apiLinkCouple(code: string): Promise<LinkCoupleResponse> {
  const res = await api.post<LinkCoupleResponse>('/couples/link', { code });
  return res.data;
}

export async function apiUnlinkCouple(): Promise<void> {
  await api.delete('/couples/link');
}

export async function apiUpdateCoupleAnniversary(
  anniversary: string | null
): Promise<CoupleStatus> {
  const res = await api.patch<CoupleStatus>('/couples/anniversary', { anniversary });
  return {
    linked: true,
    couple: res.data.couple,
  };
}

export interface DeckCard {
  id: string;
  cardId: string;
  weekStart: string;
  status: 'active' | 'played';
  assignedAt: string;
  expiresAt: string;
  title: string;
  description: string;
  category: 'date' | 'action' | 'home';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  packIcon?: string;
  event?: EventBadge | null;
}

export interface EventBadge {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
}

export interface ActiveEvent extends EventBadge {
  type: 'recurring' | 'special';
  is_active: boolean;
  premium_only: boolean;
  bonus_card_count: number;
  description: string;
}

export interface ActiveEventsResponse {
  countryEvents: ActiveEvent[];
  globalEvents: ActiveEvent[];
}

export interface DeckResponse {
  cards: DeckCard[];
  weeklyPack: {
    weekStart: string;
    openingRequired: boolean;
  };
}

export async function apiGetDeck(): Promise<DeckResponse> {
  // The API canonicalizes the collection endpoint with a trailing slash.
  // iOS drops Authorization when following that 301 redirect, so request the
  // canonical URL directly.
  const res = await api.get<DeckResponse>('/deck/');
  return res.data;
}

export interface WeeklyPackOpenResponse {
  weekStart: string;
  shouldAnimate: boolean;
}

export async function apiOpenWeeklyPack(weekStart: string): Promise<WeeklyPackOpenResponse> {
  const res = await api.put<WeeklyPackOpenResponse>('/deck/weekly-pack/open', { weekStart });
  return res.data;
}

export async function apiGetActiveEvents(): Promise<ActiveEventsResponse> {
  const res = await api.get<ActiveEventsResponse>('/events/active/');
  return res.data;
}

export interface CardPlay {
  id: string;
  userDeckId: string;
  userId: string;
  coupleId: string;
  playedAt: string;
}

export async function apiPlayCard(deckCardId: string): Promise<CardPlay> {
  const res = await api.post<{ cardPlay: CardPlay }>(`/deck/${deckCardId}/play`);
  return res.data.cardPlay;
}

export interface CardHistoryItem {
  id: string;
  userDeckId: string;
  userId: string;
  userName: string | null;
  coupleId: string;
  playedAt: string;
  title: string;
  description: string;
  event?: EventBadge | null;
  category: 'date' | 'action' | 'home';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface HistoryResponse {
  history: CardHistoryItem[];
}

export async function apiGetHistory(): Promise<HistoryResponse> {
  const res = await api.get<HistoryResponse>('/deck/history');
  return res.data;
}

export interface PlayThreadUser {
  id: string;
  displayName: string;
  avatarUrl: string;
}

export interface PlayThreadCard {
  id: string;
  title: string;
  description: string;
  category: 'date' | 'action' | 'home';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  event?: EventBadge | null;
}

export interface PlayComment {
  id: string;
  author: PlayThreadUser;
  body: string;
  createdAt: string;
}

export type PlayReactionType = 'heart' | 'heart_eyes' | 'laugh' | 'fire' | 'raised_hands';

export interface PlayReaction {
  id: string;
  user: PlayThreadUser;
  type: PlayReactionType;
  createdAt: string;
  updatedAt: string;
}

export interface PlaySchedule {
  scheduledAt: string;
  timeZone: string;
  hasTime: boolean;
  updatedBy: PlayThreadUser | null;
  updatedAt: string;
}

export interface PlayThread {
  id: string;
  playedAt: string;
  updatedAt: string;
  playedBy: PlayThreadUser;
  card: PlayThreadCard;
  schedule: PlaySchedule | null;
  comments: PlayComment[];
  reactions: PlayReaction[];
}

export async function apiGetPlayThread(playId: string): Promise<PlayThread> {
  const res = await api.get<{ thread: PlayThread }>(`/deck/plays/${playId}/thread`);
  return res.data.thread;
}

export async function apiCreatePlayComment(
  playId: string,
  body: string,
  idempotencyKey: string
): Promise<PlayComment> {
  const res = await api.post<{ comment: PlayComment }>(`/deck/plays/${playId}/comments`, {
    body,
    idempotencyKey,
  });
  return res.data.comment;
}

export interface PlayScheduleInput {
  date: string;
  time: string | null;
  timeZone: string;
}

export async function apiUpdatePlaySchedule(
  playId: string,
  input: PlayScheduleInput
): Promise<PlaySchedule> {
  const res = await api.put<{ schedule: PlaySchedule }>(`/deck/plays/${playId}/schedule`, input);
  return res.data.schedule;
}

export async function apiDeletePlaySchedule(playId: string): Promise<void> {
  await api.delete(`/deck/plays/${playId}/schedule`);
}

export async function apiUpdatePlayReaction(
  playId: string,
  type: PlayReactionType
): Promise<PlayReaction> {
  const res = await api.put<{ reaction: PlayReaction }>(`/deck/plays/${playId}/reaction`, {
    type,
  });
  return res.data.reaction;
}

export async function apiDeletePlayReaction(playId: string): Promise<void> {
  await api.delete(`/deck/plays/${playId}/reaction`);
}

export interface Pack {
  id: string;
  slug: string;
  isBase: boolean;
  priceUsd: number;
  color?: string;
  icon?: string;
  name: string;
  subtitle: string;
  description: string;
  owned: boolean;
}

export interface PacksResponse {
  packs: Pack[];
}

export async function apiGetPacks(): Promise<PacksResponse> {
  // Avoid the backend's /packs -> /packs/ redirect, which can strip the
  // Authorization header when iOS follows it.
  const res = await api.get<PacksResponse>('/packs/');
  return res.data;
}

// Subscriptions / Entitlements
export interface EntitlementsResponse {
  premium: boolean;
  source: 'own' | 'shared_from_partner' | null;
  ownerUserId: string | null;
  plan: string | null;
  status: string | null;
  expiresAt: string | null;
  entitlement: string | null;
}

export async function apiGetEntitlements(): Promise<EntitlementsResponse> {
  const res = await api.get<EntitlementsResponse>('/subscriptions/entitlements');
  return res.data;
}

// Notifications
export interface ApiNotification {
  id: string;
  title: string;
  body: string;
  category: 'played' | 'system';
  createdAt: string;
  readAt: string | null;
  data: Record<string, unknown>;
}

export interface NotificationsResponse {
  notifications: ApiNotification[];
}

export async function fetchNotifications(): Promise<NotificationsResponse> {
  const response = await api.get<NotificationsResponse>('/notifications/');
  return response.data;
}

export async function markNotificationRead(notificationId: string): Promise<ApiNotification> {
  const response = await api.patch<ApiNotification>(`/notifications/${notificationId}/read`);
  return response.data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}

export async function registerPushToken(token: string): Promise<void> {
  await api.post('/push/register', { expoPushToken: token });
}

export async function unregisterPushNotifications(): Promise<void> {
  await api.delete('/push/unregister');
}

export async function apiUpdateLocale(locale: 'es' | 'en'): Promise<ProfileData> {
  const res = await api.put<{ profile: ProfileData }>('/profiles/me', { locale });
  return res.data.profile;
}

export interface AvatarUploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
}

export async function apiGetAvatarUploadUrl(): Promise<AvatarUploadUrlResponse> {
  const res = await api.post<AvatarUploadUrlResponse>('/profiles/avatar/upload-url');
  return res.data;
}

export async function apiUpdateAvatarUrl(avatarUrl: string): Promise<ProfileData> {
  const res = await api.put<{ profile: ProfileData }>('/profiles/me', { avatarUrl });
  return res.data.profile;
}

export async function apiUpdateDisplayName(displayName: string): Promise<ProfileData> {
  const res = await api.put<{ profile: ProfileData }>('/profiles/me', { displayName });
  return res.data.profile;
}

export async function apiCompleteOnboarding(
  displayName: string,
  locale: 'es' | 'en',
  country?: string | null
): Promise<ProfileData> {
  const res = await api.put<{ profile: ProfileData }>('/profiles/me', {
    displayName,
    locale,
    ...(country ? { country } : {}),
    onboardingCompleted: true,
  });
  return res.data.profile;
}

export interface DeleteAccountResponse {
  message: string;
  deletionScheduledFor: string;
}

export async function apiDeleteAccount(): Promise<DeleteAccountResponse> {
  const res = await api.post<DeleteAccountResponse>('/auth/delete-account');
  return res.data;
}

export async function apiCancelDeletion(
  credentials: { email: string; password: string } | { idToken: string }
): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/cancel-deletion', credentials);
  return res.data;
}
