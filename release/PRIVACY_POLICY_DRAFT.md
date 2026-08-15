# Focus Flow Privacy Policy — Draft for Legal Review

> **Draft — review with a qualified lawyer before publishing.** This document describes the current local-first Android application as implemented. Before public release, the publisher must replace the contact and legal-entity fields below, host this policy at a stable public URL, and re-check it against the final signed build, all third-party SDKs, the Google Play Data safety form, and each launch territory’s requirements.

**Effective date:** 14 August 2026  
**Publisher:** `[LEGAL_ENTITY_OR_INDIVIDUAL_NAME_TO_BE_CONFIRMED]`  
**Privacy contact:** `[PUBLIC_SUPPORT_EMAIL_TO_BE_CONFIRMED]`

## 1. Scope

This Privacy Policy explains how Focus Flow handles information when you use the Android application. Focus Flow is a self-management and productivity tool. It is not a parental-control service, enterprise device-management product, or security product.

## 2. Information stored on your device

Focus Flow stores the following information in the app’s local storage on your device:

| Information | Purpose |
| --- | --- |
| To-dos, subtasks, due dates, priorities, and progress | To show and manage your personal plan. |
| Habits, completion dates, streaks, and progress | To show habit progress and satisfy rules you create. |
| Notes | To let you save ideas and optionally turn them into To-dos. |
| Focus rules, schedules, and selected app package identifiers | To determine when your chosen focus rule should apply. |
| Display preferences and acknowledgement of the accessibility disclosure | To preserve your visual settings and consent-flow state. |

Focus Flow does not require an account and does not provide cloud synchronization. This information is not transmitted by Focus Flow to a server operated by the publisher.

## 3. Optional AccessibilityService

If you choose to enable the optional Android AccessibilityService, Focus Flow detects when an app that you selected comes to the foreground. It uses that event only to apply the focus rule you configured.

Focus Flow does **not** use the AccessibilityService to read screen text, messages, typed content, passwords, screenshots, or web browsing content. It does not record or transmit those materials. You can disable the AccessibilityService at any time in Android’s accessibility settings. Disabling the service stops the native focus-gate behavior, but it does not remove your locally stored planning data.

## 4. Sharing and sale of information

Focus Flow does not sell, rent, or share your To-dos, habits, notes, or app-activity information with third parties. It does not include advertising SDKs or behavioral tracking SDKs.

## 5. Diagnostics and feedback

If you voluntarily send feedback through Google Play, email, or another support channel, that channel may process the information you provide under its own terms. Do not include passwords, private messages, or other sensitive content in feedback. The publisher will use feedback to investigate defects, provide support, and improve Focus Flow.

## 6. Retention and deletion

Your planning data remains in the app’s local storage until you edit or delete it, choose **Delete all data from this device** in the app’s Privacy & data screen, clear app storage, or uninstall the app. The in-app deletion action permanently removes your planning data, routine configuration, progress, and display settings, and turns off App limits. Because Focus Flow has no user account and does not sync planning data to a publisher-operated server, the publisher cannot retrieve or delete local data for you remotely.

## 7. Security

Focus Flow uses the operating system’s application storage for local data. No method of electronic storage is completely secure. Keep your device protected with the security controls provided by its operating system.

## 8. Children

Focus Flow is designed for self-management. It is not directed to children and is not intended to be used by parents, guardians, schools, or employers to monitor or manage another person’s device.

## 9. Changes

If this policy changes, the publisher will update the effective date and provide notice in the app or through the store listing when the change is material.

## 10. Contact

For privacy questions, contact `[PUBLIC_SUPPORT_EMAIL_TO_BE_CONFIRMED]`.

## Publication blockers

This draft must not be submitted to Google Play until all fields labelled `TO_BE_CONFIRMED` are replaced with the publisher’s real legal name or business name and a monitored public support email address. The final hosted policy must match the signed release build and its Data safety declaration.

## References

[1]: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en-GB "Google Play Console Help: Provide information for Google Play's Data safety section"
[2]: https://support.google.com/googleplay/android-developer/answer/10964491?hl=en-GB "Google Play Console Help: Use of the AccessibilityService API"
