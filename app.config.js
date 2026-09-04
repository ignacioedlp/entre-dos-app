const GOOGLE_SAMPLE_APP_ID_IOS = 'ca-app-pub-3940256099942544~1458002511';
const GOOGLE_SAMPLE_APP_ID_ANDROID = 'ca-app-pub-3940256099942544~3347511713';
const ADMOB_APP_ID_IOS = process.env.ADMOB_APP_ID_IOS;
const ADMOB_APP_ID_ANDROID = process.env.ADMOB_APP_ID_ANDROID;

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
