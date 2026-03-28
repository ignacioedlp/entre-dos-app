import axios from 'axios';
import { clearAll, getToken, ProfileData } from './storage';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'https://discrete-interest-giant-environments.trycloudflare.com/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
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

export async function apiRegister(email: string, password: string, passwordConfirm: string, locale?: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/register', { email, password, passwordConfirm, locale });
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

export async function apiUpdateCoupleAnniversary(anniversary: string | null): Promise<CoupleStatus> {
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
}

export interface DeckResponse {
  cards: DeckCard[];
}

export async function apiGetDeck(): Promise<DeckResponse> {
  const res = await api.get<DeckResponse>('/deck');
  return res.data;
}

export async function apiPlayCard(deckCardId: string): Promise<void> {
  await api.post(`/deck/${deckCardId}/play`);
}

export interface CardHistoryItem {
  id: string;
  userDeckId: string;
  userId: string;
  userName: string | null;
  coupleId: string;
  note: string | null;
  playedAt: string;
  title: string;
  description: string;
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

export interface Pack {
  id: string;
  slug: string;
  isBase: boolean;
  priceUsd: number;
  color: string;
  name: string;
  subtitle: string;
  description: string;
  owned: boolean;
}

export interface PacksResponse {
  packs: Pack[];
}

export async function apiGetPacks(): Promise<PacksResponse> {
  const res = await api.get<PacksResponse>('/packs');
  return res.data;
}

// Subscriptions / Entitlements
export interface EntitlementsResponse {
  premium: boolean;
  source: "own" | "shared_from_partner" | null;
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
  category: "played" | "system";
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

export async function apiCompleteOnboarding(displayName: string, locale: 'es' | 'en'): Promise<ProfileData> {
  const res = await api.put<{ profile: ProfileData }>('/profiles/me', {
    displayName,
    locale,
    onboardingCompleted: true,
  });
  return res.data.profile;
}