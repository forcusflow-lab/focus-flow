# Focus Flow — Google Play Closed Beta Checklist

## A. Product package

- [ ] Update `app.config.ts` version and Android `versionCode` for the beta build.
- [ ] Generate a signed Android App Bundle (`.aab`) with the final Config Plugin output.
- [ ] Verify the AccessibilityService, gate activity, widget receiver, and service XML in the generated Android project.
- [ ] Run all automated tests, TypeScript checks, lint, and Android prebuild from a clean working tree.
- [ ] Test a development or release build on at least two physical Android devices and a clean user profile.

## B. Accessibility and privacy

- [x] Display a prominent in-app explanation before first enabling the focus gate.
- [x] Provide an affirmative action before opening Android accessibility settings.
- [x] Explain that the feature is optional and can be disabled in Android settings.
- [x] State that Focus Flow does not read screen text, messages, typed content, or screenshots.
- [ ] Replace the legal-entity and public support-email fields in `PRIVACY_POLICY_DRAFT.md`.
- [ ] Host the finalized privacy policy at a stable, public HTTPS URL.
- [ ] Complete the Play Console AccessibilityService declaration and attach an accurate demonstration video or review instructions.
- [ ] Complete the Data safety form from the signed build and every included SDK, not from assumptions about source code alone.

## C. Store content

- [x] Prepare the English listing copy in `GOOGLE_PLAY_STORE_LISTING_EN.md`.
- [ ] Prepare 5 English screenshots using the storyboard in the listing document.
- [ ] Create a 1024×500 feature graphic that does not imply unbreakable device control.
- [ ] Add the privacy-policy URL, support email, app category, target countries, and content rating in Play Console.
- [ ] Review all claims for accuracy: no “unbreakable,” “parental control,” “monitoring,” or “device management” wording.

## D. Test operation

- [x] Prepare the test script and feedback format in `CLOSED_BETA_GUIDE_EN.md`.
- [ ] Recruit 30–60 Android testers who understand the beta’s purpose and device-level limitation.
- [ ] Start with an internal test, then a closed test group.
- [ ] Run the first-session test script and collect device model, Android version, and reproduction steps.
- [ ] Pause expansion if a P0 device-availability or redirection-loop issue appears.

## E. Monetization boundary

- [ ] Keep the closed beta free until the first-session, safety, and retention signals are reliable.
- [ ] Before selling Plus features, integrate and test Google Play Billing, purchase restoration, cancellation, trial expiration, and entitlement behavior.
- [ ] Use Google Play Billing for in-app digital features or subscriptions distributed on Google Play unless a documented exception applies.[1]

## References

[1]: https://support.google.com/googleplay/android-developer/answer/10281818?hl=en-GB "Google Play Console Help: Understanding Google Play's payments policy"
[2]: https://support.google.com/googleplay/android-developer/answer/10964491?hl=en-GB "Google Play Console Help: Use of the AccessibilityService API"
[3]: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en-GB "Google Play Console Help: Provide information for Google Play's Data safety section"
