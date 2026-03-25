import axios from 'axios';
import { clearAll, getToken, ProfileData } from './storage';

const api = axios.create({
  baseURL: 'https://discrete-interest-giant-environments.trycloudflare.com/api',
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
    userBId: string;
    linkedAt: string;
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

export async function apiRegister(email: string, password: string, passwordConfirm: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/register', { email, password, passwordConfirm });
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
