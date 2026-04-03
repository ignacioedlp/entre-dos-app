import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'entre-dos-auth' });

const TOKEN_KEY = 'auth.token';
const PROFILE_KEY = 'auth.profile';

export interface ProfileData {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  coupleId: string | null;
  coupleCode: string;
  locale: 'es' | 'en';
  country: string | null;
  pushNotifications: boolean;
  onboardingCompleted: boolean;
}

export function getToken(): string | null {
  return storage.getString(TOKEN_KEY) ?? null;
}

export function setToken(token: string): void {
  storage.set(TOKEN_KEY, token);
}

export function clearToken(): void {
  storage.remove(TOKEN_KEY);
}

export function getProfile(): ProfileData | null {
  const raw = storage.getString(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProfileData;
  } catch {
    return null;
  }
}

export function setProfile(profile: ProfileData): void {
  storage.set(PROFILE_KEY, JSON.stringify(profile));
}

export function clearProfile(): void {
  storage.remove(PROFILE_KEY);
}

export function clearAll(): void {
  storage.remove(TOKEN_KEY);
  storage.remove(PROFILE_KEY);
}
