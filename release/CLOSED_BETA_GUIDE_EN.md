# Focus Flow Closed Beta Guide

## Tester invitation

> **Focus Flow is an Android productivity beta.** It helps you finish required To-dos and habits before opening selected distracting apps. The app stores your planning data locally on your device. Its optional AccessibilityService only detects when selected apps come to the foreground to apply the focus rule; it does not read screen text, messages, typed content, or screenshots. You can disable it anytime in Android settings.
>
> We are looking for feedback on setup clarity, reliability, and whether the experience helps you follow through on your daily intentions. Please do not use the beta as the only safeguard for safety-critical, parental-control, or device-management needs.

## First-session test script

| Step | Tester action | Expected outcome |
| --- | --- | --- |
| 1 | Install through the Google Play closed test link. | App opens without account creation. |
| 2 | Create one Required Todo and one normal Todo. | The Required label clearly explains that it affects the focus gate. |
| 3 | Create a named schedule and select one non-system app. | Rule name, days, time window, and app selection are visible. |
| 4 | Read the AccessibilityService disclosure and choose the Android settings action. | The disclosure appears before Android accessibility settings are opened. |
| 5 | Enable the service manually in Android settings. | App reports that the service is enabled after returning. |
| 6 | Open the selected app while the schedule is active and the Required Todo is incomplete. | Focus Flow shows its explanation screen instead of allowing the selected app to remain foregrounded. |
| 7 | Complete the Required Todo and retry. | The selected app is no longer redirected by the focus gate. |
| 8 | Disable the service from Android settings. | The app no longer applies the native focus gate. |

## Feedback template

```text
Device model:
Android version:
Focus Flow version:
Schedule that was active:
Selected app package/name:
Required items still incomplete:
What you expected:
What happened:
Steps to reproduce:
Screenshot or screen recording (remove private content first):
```

## Severity rules

| Severity | Definition | Release action |
| --- | --- | --- |
| P0 | User cannot return to normal device use, system UI is disrupted, or an unintended app is repeatedly redirected. | Pause rollout; prioritize mitigation and a fail-open fix. |
| P1 | Selected app is incorrectly allowed or blocked in a reproducible schedule/achievement state. | Fix before expanding the beta cohort. |
| P2 | UI confusion, copy issue, visual defect, or intermittent problem with a workaround. | Record, triage weekly, and fix by user impact. |

## Operator notes

Collect feedback privately through the Play Console test channel and a support channel controlled by the publisher. Google Play’s closed testing feedback is not public, so use it for early reliability and consent-flow findings.[1]

## References

[1]: https://play.google.com/console/about/closed-testing/ "Google Play Console: Closed testing"
