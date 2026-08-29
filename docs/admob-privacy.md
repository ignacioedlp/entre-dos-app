# AdMob privacy decision

## Decision

Entre Dos serves **non-personalized rewarded ads**. The app does not request App
Tracking Transparency (ATT), does not include `NSUserTrackingUsageDescription`,
and does not access the IDFA. Every rewarded-ad request sets
`requestNonPersonalizedAdsOnly: true`.

The existing User Messaging Platform flow still gathers regional consent before
the Google Mobile Ads SDK initializes and exposes its privacy-options form in
Settings → Privacy.

## App Store Connect checklist

Before each submission, review Google's current [iOS App Store data-disclosure
guide](https://developers.google.com/admob/ios/privacy/data-disclosure) and
declare the Google Mobile Ads SDK data that applies to the released build:

- Device ID and approximate location derived from IP address.
- Diagnostics and performance data.
- Advertising data and ad interactions.

For this no-ATT, non-personalized implementation, do **not** declare tracking
through the IDFA or personalized advertising. Review the final generated iOS
privacy report and any AdMob mediation SDKs before submission, as these can add
their own disclosures.

## Physical iOS verification

1. Install a fresh production-like build on a physical iPhone.
2. Confirm no ATT system alert appears.
3. In an EEA/UK test configuration, confirm UMP presents the applicable consent
   choices before ads initialize.
4. Load a rewarded ad and verify it completes normally.
5. Open Settings → Privacy → Ad privacy options and verify the UMP form opens.
