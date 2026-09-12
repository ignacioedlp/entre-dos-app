const GOOGLE_SAMPLE_APP_ID_IOS = 'ca-app-pub-3940256099942544~1458002511';
const GOOGLE_SAMPLE_APP_ID_ANDROID = 'ca-app-pub-3940256099942544~3347511713';
const ADMOB_APP_ID_IOS = process.env.ADMOB_APP_ID_IOS;
const ADMOB_APP_ID_ANDROID = process.env.ADMOB_APP_ID_ANDROID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

function googleIosUrlScheme(clientId) {
  const suffix = '.apps.googleusercontent.com';

  if (!clientId) {
    throw new Error('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is required');
  }
  if (!clientId.endsWith(suffix)) {
    throw new Error('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID must end with .apps.googleusercontent.com');
  }

  return `com.googleusercontent.apps.${clientId.slice(0, -suffix.length)}`;
}

function appId(name, value, fallback) {
  if (!value && process.env.EAS_BUILD_PROFILE === 'production') {
    throw new Error(`${name} is required for production builds`);
  }
  return value ?? fallback;
}

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    [
      '@react-native-google-signin/google-signin',
      {
        // The callback scheme must be derived from the same iOS OAuth client
        // used by GoogleSignin.configure. A stale scheme makes the native
        // sign-in sheet unable to return to the app in release builds.
        iosUrlScheme: googleIosUrlScheme(GOOGLE_IOS_CLIENT_ID),
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        iosAppId: appId('ADMOB_APP_ID_IOS', ADMOB_APP_ID_IOS, GOOGLE_SAMPLE_APP_ID_IOS),
        androidAppId: appId(
          'ADMOB_APP_ID_ANDROID',
          ADMOB_APP_ID_ANDROID,
          GOOGLE_SAMPLE_APP_ID_ANDROID
        ),
        delayAppMeasurementInit: true,
      },
    ],
  ],
});
