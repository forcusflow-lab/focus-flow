# Focus Flow — Google Play Console Submission Pack

**Prepared on 2026-08-15 by Manus AI.** This pack consolidates the exact information needed to move from the signed Android build to a closed test, then to a public release. It does not replace the Google Play Console forms: the publisher must complete every form using the final signed AAB and the final list of included SDKs.

## Release identity

| Field | Prepared value | Publisher action |
| --- | --- | --- |
| Application ID | `com.app.focusflow` | Create the Play Console application with this immutable package ID. |
| Version name | `1.0.0` | Increment before every uploaded release. |
| Android version code | `1` | Increment before every uploaded AAB; never reuse an uploaded value. |
| App name | Focus Flow | Validate availability and localize after first English release. |
| Category | Productivity | Set in Store settings. |
| Core value | Complete must-dos before selected distracting apps become available. | Keep all marketing claims consistent with this limited, user-configured behavior. |

## AccessibilityService declaration and review video

Focus Flow’s Android AccessibilityService is optional. It detects only when an app selected by the user reaches the foreground and then applies the user’s chosen rule while required items remain incomplete. It does not read screen text, messages, typed content, passwords, screenshots, or browsing content. It does not transmit To-dos, notes, or app-activity information to the publisher.

The Console declaration and a 60–120 second landscape review video should demonstrate the following sequence. The recording must use a real signed build on a real Android device, not a mockup.

| Time | Show | Reviewer takeaway |
| --- | --- | --- |
| 0:00–0:15 | Today screen; create or show an unfinished required task. | The user selects their own must-do. |
| 0:15–0:35 | Settings; choose an app and an active routine. | The user selects their own scope and schedule. |
| 0:35–0:55 | In-app Accessibility explanation and affirmative action. | The disclosure is prominent, specific, optional, and accepted before settings open. |
| 0:55–1:10 | Android Accessibility settings; enable Focus Flow. | The OS consent screen is the final device-level opt-in. |
| 1:10–1:25 | Open the selected app while the must-do remains incomplete. | The configured rule is applied. |
| 1:25–1:40 | Use “Review today’s must-dos”, then show that the user can turn App limits off in Settings or Android Accessibility settings. | Rules are user-configured, transparent, and can be stopped by the user. |
| 1:40–1:55 | Privacy & data screen. | Local storage, optional service, and deletion control are explained. |

Do not describe the feature as parental controls, monitoring, device management, unbreakable blocking, or a guarantee of uninterrupted restriction. Google Play requires a declaration for non-accessibility-tool uses of the AccessibilityService API and expects a clear, prominent in-app disclosure.[1]

## Data safety worksheet — verify against the final AAB

| Prompt area | Codebase evidence today | Final Console decision |
| --- | --- | --- |
| Account required | No account or cloud sync in the Focus Flow provider. | Confirm no account SDK or server integration was added. |
| App data collection | Todos, habits, notes, schedules, selected package identifiers, and display settings are held in local app storage. | If final build sends none of this off-device to the publisher or a third party, assess the applicable “not collected” answers in Console. Re-check every included SDK. |
| App activity | The optional service observes foreground status only for packages selected by the user. | Confirm with final behavior and policy guidance; do not infer solely from source code. |
| Sharing / sale | No advertising or behavioral tracking SDK is intentionally included. | Confirm every dependency and SDK declaration before submitting. |
| User controls | In-app deletion removes local planning data and turns off App limits. | Verify deletion on a real device before public release. |

Data safety must reflect the app’s actual data practices and every included SDK, including tests and production variants.[2]

## Store-assets production sheet

| Asset | Prepared status | Final production requirement |
| --- | --- | --- |
| Short and full description | Prepared in `GOOGLE_PLAY_STORE_LISTING_EN.md` | Paste only after a final policy-claim review. |
| Feature graphic | Source prepared at `/manus-storage/focus-flow-feature-graphic_e5ad8b40.png` | Export a 1024 × 500 px PNG/JPEG. Keep the central task-card/open-lock illustration and do not add price or “unbreakable” claims. |
| Screenshot 1 | Storyboard prepared | Real device: Today screen showing essential-task progress and a clear App limits state. |
| Screenshot 2 | Storyboard prepared | Real device: Required task with progress goal and subtasks. Use fictional, non-sensitive sample content. |
| Screenshot 3 | Storyboard prepared | Real device: named routine with days, active hours, and user-selected app. |
| Screenshot 4 | Storyboard prepared | Real device: Accessibility disclosure before Android settings. |
| Screenshot 5 | Storyboard prepared | Real device: habit and note screens with visual settings. |

Keep preview assets accurate because the same app identity and preview materials are visible in testing and public distribution.[3]

## Test-track release gate

The publisher should create an internal test first, then a closed test. Before any public rollout, the test owner records model, Android version, permission status, schedule state, and outcome for each script below.

| Test | Pass criterion | Stop condition |
| --- | --- | --- |
| First setup | A new tester can create one must-do, select one app, understand the disclosure, and return from Android settings. | Accessibility entry or status detection is confusing or fails. |
| Rule application | The selected app redirects only while required items remain open and the routine is active. | Any non-selected app is redirected, or the user cannot stop a rule from Settings or Android Accessibility settings. |
| Release | Completing the must-do releases the configured app without delay. | Completion does not release the app in a stable configuration. |
| Timed completion | A timed required item does not complete before its timer expires; a licensed tester can purchase one early completion when the store product is configured. | An item completes before time elapses, or a completed item fails to release the rule. |
| Data deletion | Privacy & data deletion removes local records and turns off limits. | Data remains after confirmed deletion or native gate remains enabled. |

## Commercial launch gate

Do not sell Plus or the one-time early completion until these conditions are all met: the above tests pass on multiple devices, the public policy URL and support inbox are active, the Data safety and Accessibility declarations match the final AAB, and Play Billing has been verified using license testers. Verify Plus purchase, restoration, cancellation, and expiry; verify `focus_flow_early_complete_100` purchase, cancellation, consumption, and repurchase. See `PLUS_COMMERCIAL_SPEC.md` for the product boundary and state contract.

## References

[1]: https://support.google.com/googleplay/android-developer/answer/10964491?hl=en-GB "Google Play: Use of the AccessibilityService API"
[2]: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en-GB "Google Play: Provide information for Google Play's Data safety section"
[3]: https://support.google.com/googleplay/android-developer/answer/9866151 "Google Play: Add preview assets to showcase your app"
