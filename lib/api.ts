import axios from 'axios';
import { clearAll, getToken, ProfileData } from './storage';

type UnauthorizedListener = () => void;

const unauthorizedListeners = new Set<UnauthorizedListener>();

export function subscribeToUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

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
      unauthorizedListeners.forEach((listener) => listener());
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

export async function apiAppleAuth(
  idToken: string,
  appleUser: string,
  locale: string,
  fullName?: string | null
): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/apple', {
    idToken,
    appleUser,
    locale,
    fullName,
  });
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
  extraUnlock?: {
    source: 'rewarded_ad' | 'premium';
    unlockedBy: { id: string; displayName: string; avatarUrl: string };
  } | null;
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
  weeklyChanges: {
    limit: number;
    remaining: number;
  };
  extraCard: {
    weekStart: string;
    state: 'available' | 'claimed' | 'unavailable';
    requiresAd: boolean;
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

export type ExtraCardClaimResponse =
  | { status: 'granted'; card: DeckCard }
  | {
      status: 'ad_required';
      attemptId: string;
      adUnitId: string;
      userId: string;
      customData: string;
    };

export async function apiClaimExtraCard(platform: 'ios' | 'android') {
  const response = await api.post<ExtraCardClaimResponse>('/deck/extra-card/claim', { platform });
  return response.data;
}

export type ExtraCardAttemptResponse =
  | { status: 'pending' | 'expired' }
  | { status: 'granted'; card: DeckCard };

export async function apiGetExtraCardAttempt(attemptId: string) {
  const response = await api.get<ExtraCardAttemptResponse>(
    `/deck/extra-card/attempts/${attemptId}`,
    { timeout: 1800 }
  );
  return response.data;
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

export interface CardSwapResponse {
  card: DeckCard;
  changesRemaining: number;
}

export async function apiSwapCard(deckCardId: string): Promise<CardSwapResponse> {
  const res = await api.post<CardSwapResponse>(`/deck/${deckCardId}/swap`);
  return res.data;
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
  photo: PlayPhoto | null;
}

export interface PlayPhoto {
  status: 'pending' | 'approved' | 'rejected' | 'error';
  url?: string;
}

export interface AlbumMoment {
  id: string;
  playedAt: string;
  playedBy: PlayThreadUser;
  card: PlayThreadCard;
  photo: PlayPhoto | null;
  commentCount: number;
  reactionCount: number;
}

export interface AlbumMomentsResponse {
  moments: AlbumMoment[];
  nextCursor: string | null;
}

export async function apiGetAlbumMoments(cursor?: string | null): Promise<AlbumMomentsResponse> {
  const res = await api.get<AlbumMomentsResponse>('/album/moments', {
    params: { limit: 20, ...(cursor ? { cursor } : {}) },
  });
  return res.data;
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

export async function apiUploadPlayPhoto(
  playId: string,
  image: { uri: string; mimeType?: string | null; fileName?: string | null },
  idempotencyKey: string
): Promise<PlayPhoto | null> {
  const form = new FormData();
  form.append('idempotencyKey', idempotencyKey);
  form.append('image', {
    uri: image.uri,
    type: image.mimeType || 'image/jpeg',
    name: image.fileName || 'play-photo.jpg',
  } as unknown as Blob);
  const res = await api.post<{ photo: PlayPhoto | null }>(`/deck/plays/${playId}/photo`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.photo;
}

export async function apiDeletePlayPhoto(playId: string): Promise<void> {
  await api.delete(`/deck/plays/${playId}/photo`);
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

export type CardCategory = 'date' | 'action' | 'home';
export type CardRarity = 'common' | 'rare' | 'legendary';

export interface CustomCard {
  id: string;
  title: string;
  description: string;
  category: CardCategory;
  rarity: CardRarity;
  isActive: boolean;
  isArchived: boolean;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
}

export interface CustomCardsResponse {
  cards: CustomCard[];
  limit: number;
  rarityLimits: Record<CardRarity, number>;
}

export interface CustomCardInput {
  title: string;
  description: string;
  category: CardCategory;
  rarity: CardRarity;
}

export async function apiGetCustomCards(): Promise<CustomCardsResponse> {
  const res = await api.get<CustomCardsResponse>('/cards/custom');
  return res.data;
}

export async function apiCreateCustomCard(input: CustomCardInput): Promise<CustomCard> {
  const res = await api.post<{ card: CustomCard }>('/cards/custom', input);
  return res.data.card;
}

export async function apiUpdateCustomCard(
  cardId: string,
  input: CustomCardInput
): Promise<CustomCard> {
  const res = await api.patch<{ card: CustomCard }>(`/cards/custom/${cardId}`, input);
  return res.data.card;
}

export async function apiSetCustomCardActive(
  cardId: string,
  isActive: boolean
): Promise<CustomCard> {
  const res = await api.patch<{ card: CustomCard }>(`/cards/custom/${cardId}`, { isActive });
  return res.data.card;
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
  credentials:
    | { email: string; password: string }
    | { idToken: string; provider: 'google' | 'apple' }
): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/cancel-deletion', credentials);
  return res.data;
}
