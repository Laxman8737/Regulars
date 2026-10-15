# Bahi security checklist (from the "19 security holes" list)

| # | Item | Status |
|---|------|--------|
| 1 | Row-level security | DONE. Firestore rules: only the verified owner reads/writes `users/{uid}/...`. File `firestore.rules` is in this zip. |
| 2 | Auth on every API route | DONE. Cloud Functions `sendOtp`, `verifyOtp`, `sendBill` all reject signed-out callers. |
| 3 | Never trust the frontend | DONE. OTP codes, GST-free sending limits, "own customers only" and account deletion are checked on the server. |
| 4 | Rate limiting | DONE. OTP: 1 per 30 s, 10 a day, 5 wrong tries. Bills: 20 a minute, 1000 a day per shop. Firebase Auth also throttles logins. |
| 5 | Sanitise user input | DONE. Every value shown from the database goes through `esc()`; fields have length limits; phone numbers are validated. |
| 6 | Parameterised queries | N/A. Firestore has no SQL. Queries use typed values only. |
| 7 | Lock down CORS | DONE. Callable functions only accept Firebase-signed requests from your app. |
| 8 | HTTPS everywhere | DONE. GitHub Pages and Firebase are HTTPS only. |
| 9 | Stop IDOR bugs | DONE. Paths contain the user's own uid and rules compare it with the signed-in uid; `sendBill` checks the number belongs to the caller's customers. |
| 10 | Debug mode off in production | DONE. No debug flags; server logs only errors. |
| 11 | CAPTCHA on public forms | READY, needs you. Turn on **Firebase App Check** (reCAPTCHA v3), paste the site key into `appCheckKey` in `window.APP`, then set `ENFORCE_APPCHECK=true` in `otp-server/functions/.env` and redeploy. |
| 12 | Log admin actions | N/A. There is no admin panel. `sendBill` writes each sent bill to `users/{uid}/bills`. |
| 13 | Private storage buckets | N/A. The app uses no Cloud Storage. |
| 14 | Hide admin pages | N/A. No admin pages exist. |
| 15 | Update vulnerable packages | PARTLY. Firebase web SDK is pinned (10.12.2). Run `npm audit` and update `functions/package.json` before each deploy. |
| 16 | Check file upload types | N/A. The app has no uploads. |
| 17 | Security review | DONE once by hand while building. Run your own review (for example with Claude Code) before launch. |
| 18 | Security headers | PARTLY. GitHub Pages cannot send custom headers. A safe `Content-Security-Policy` meta (no plugins, no base tag, same-origin forms) and a referrer policy are added. For full headers, host on Firebase Hosting and add them in `firebase.json`. |
| 19 | Verify webhook signatures | N/A. No webhooks are used. |

Known trade-offs: the "This email already exists" message (requested) lets someone test whether an email is registered.
