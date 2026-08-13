# Focus Flow — Google Play Billing Implementation Decision

## Decision

Focus Flow will use the **native Google Play Billing Library** through its existing Expo Config Plugin and Kotlin bridge for the Android-first release. The app will not show a purchasable Plus plan until its Play Console application, subscription product, privacy contact, and closed-test track are configured. This avoids presenting a non-functional paywall or collecting payment details outside Google Play.

The initial commercial offer will be one subscription entitlement, `focus_flow_plus`, with a monthly base plan and an annual base plan. The exact localized prices, free-trial offer, and availability countries will be configured in Play Console after beta reliability is demonstrated. Entitlement is device-local during the beta, but the design reserves an ownership-refresh action so that active Google Play purchases can be recognized when the app returns to the foreground.

## Technical boundary

| Area | Decision |
| --- | --- |
| Billing client | One native `BillingClient` maintained while the app is in use, with automatic service reconnection. |
| Product catalog | Query product details dynamically from Google Play; do not hard-code display price or offer eligibility. |
| Purchase processing | Process purchase updates and query existing purchases when the billing client is ready and when the app returns to foreground. |
| Entitlement | Unlock Plus only after a purchase is verified, granted, and acknowledged. The initial beta does not claim cross-device guarantees. |
| Restoration | Provide a visible “Restore purchases” action that queries current subscriptions from Google Play. |
| Pending / failure states | Keep the app usable, show a clear pending or failure state, and never promise an entitlement before Google Play confirms it. |
| Server validation | Defer to the production expansion stage. Add a server component and real-time developer notifications before relying on paid access across multiple devices or for dispute-sensitive operations. |

## Required Play Console inputs

The publisher must create the application record, set up the subscription product identifiers, create base plans/offers, add license testers, and make the chosen test build available through a Play testing track. A package name must match the Play Console app for license-tester billing tests.[1] [2]

## Test matrix before money is accepted

| Scenario | Expected behavior |
| --- | --- |
| New monthly purchase | Google Play completes purchase; Focus Flow acknowledges the purchase and unlocks Plus. |
| Annual purchase | The annual offer is displayed only when returned by the Play catalog and unlocks Plus after confirmation. |
| Restore after reinstall | “Restore purchases” recognizes the active purchase after Play account matching. |
| Pending purchase | The app shows pending status and keeps Plus locked until the purchase becomes completed. |
| Cancellation / expiry | Refresh removes Plus access when the active entitlement no longer exists. |
| Network or service disconnect | The app keeps its current non-destructive state and offers retry; no false “payment complete” claim. |
| License-tester payment decline | The app displays an understandable failure state without unlocking Plus. |

## Product gates: Free vs Plus

Free users retain core daily planning: normal and required To-dos, habits, notes, one active routine rule, and one selected restriction app. Plus will be considered only after the beta validates the core experience; candidate Plus capabilities are unlimited routine rules, multiple restricted apps, advanced recurring templates, and richer weekly insights. The native focus gate must remain safe and understandable for all users, including those who never purchase Plus.

## References

[1]: https://developer.android.com/google/play/billing/integrate "Android Developers: Integrate the Google Play Billing Library into your app"
[2]: https://developer.android.com/google/play/billing/test "Android Developers: Test your Google Play Billing Library integration"
