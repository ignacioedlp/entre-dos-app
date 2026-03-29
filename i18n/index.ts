import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// ── English namespaces ──────────────────────────────────────
import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import enHome from '@/locales/en/home.json';
import enSettings from '@/locales/en/settings.json';
import enNotifications from '@/locales/en/notifications.json';

// ── Spanish namespaces ──────────────────────────────────────
import esCommon from '@/locales/es/common.json';
import esAuth from '@/locales/es/auth.json';
import esHome from '@/locales/es/home.json';
import esSettings from '@/locales/es/settings.json';
import esNotifications from '@/locales/es/notifications.json';

const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'en';

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  lng: deviceLang,
  fallbackLng: 'en',
  ns: ['common', 'auth', 'home', 'settings', 'notifications'],
  defaultNS: 'common',
  resources: {
    en: {
      common: enCommon,
      auth: enAuth,
      home: enHome,
      settings: enSettings,
      notifications: enNotifications,
    },
    es: {
      common: esCommon,
      auth: esAuth,
      home: esHome,
      settings: esSettings,
      notifications: esNotifications,
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
