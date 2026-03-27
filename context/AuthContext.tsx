import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import * as Localization from "expo-localization";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { apiLogin, apiRegister, apiGoogleAuth } from "../lib/api";
import {
  clearAll,
  getProfile,
  getToken,
  ProfileData,
  setProfile,
  setToken,
} from "../lib/storage";
import i18n from "@/i18n";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  profileImageSize: 120,
});

interface AuthState {
  user: ProfileData | null;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<ProfileData>;
  googleLogin: () => Promise<ProfileData>;
  register: (
    email: string,
    password: string,
    passwordConfirm: string,
  ) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: ProfileData) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    user: getProfile(),
    token: getToken(),
  }));

  useEffect(() => {
    if (state.user) {
      i18n.changeLanguage(state.user.locale);
    }
  }, [state.user]);

  async function login(email: string, password: string): Promise<ProfileData> {
    const { accessToken, profile } = await apiLogin(email, password);
    setToken(accessToken);
    setProfile(profile);
    setState({ user: profile, token: accessToken });
    i18n.changeLanguage(profile.locale);
    return profile;
  }

  async function register(
    email: string,
    password: string,
    passwordConfirm: string,
  ): Promise<void> {
    const deviceLang = Localization.getLocales()[0]?.languageCode ?? "es";
    const locale = deviceLang === "en" ? "en" : "es";
    const { accessToken, profile } = await apiRegister(
      email,
      password,
      passwordConfirm,
      locale,
    );
    setToken(accessToken);
    setProfile(profile);
    setState({ user: profile, token: accessToken });
  }

  async function googleLogin(): Promise<ProfileData> {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken;
    if (!idToken) throw new Error("No Google ID token received");
    const deviceLang = Localization.getLocales()[0]?.languageCode ?? "es";
    const locale = deviceLang === "en" ? "en" : "es";
    const { accessToken, profile } = await apiGoogleAuth(idToken, locale);
    setToken(accessToken);
    setProfile(profile);
    setState({ user: profile, token: accessToken });
    i18n.changeLanguage(profile.locale);
    return profile;
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
    <AuthContext.Provider
      value={{ ...state, login, googleLogin, register, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
