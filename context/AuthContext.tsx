import { createContext, useContext, useState, ReactNode } from 'react';
import { apiLogin, apiRegister } from '../lib/api';
import {
  clearAll,
  getProfile,
  getToken,
  ProfileData,
  setProfile,
  setToken,
} from '../lib/storage';

interface AuthState {
  user: ProfileData | null;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<ProfileData>;
  register: (email: string, password: string, passwordConfirm: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: ProfileData) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    user: getProfile(),
    token: getToken(),
  }));

  async function login(email: string, password: string): Promise<ProfileData> {
    const { accessToken, profile } = await apiLogin(email, password);
    setToken(accessToken);
    setProfile(profile);
    setState({ user: profile, token: accessToken });
    return profile;
  }

  async function register(email: string, password: string, passwordConfirm: string): Promise<void> {
    const { accessToken, profile } = await apiRegister(email, password, passwordConfirm);
    setToken(accessToken);
    setProfile(profile);
    setState({ user: profile, token: accessToken });
  }

  function logout(): void {
    clearAll();
    setState({ user: null, token: null });
  }

  function updateProfile(profile: ProfileData): void {
    setProfile(profile);
    setState((prev) => ({ ...prev, user: profile }));
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
