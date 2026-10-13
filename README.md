# Regulars | Customer ledger

Installable web app (PWA) for Android, iPhone and desktop. Backend: Firebase (Auth + Firestore).

## Publish
1. Upload every file in this folder to the top level of your GitHub repo (index.html, sw.js, manifest.webmanifest, icons).
2. Settings -> Pages -> Deploy from a branch -> main / (root).
3. Firebase console -> Authentication -> Settings -> Authorized domains: add `yourname.github.io`.
4. Firestore rules: only verified owners can read/write `users/{uid}/...`.

## Install
- Android / Chrome / Edge / desktop: Profile -> Install app (or browser menu -> Install app).
- iPhone: Share -> Add to Home Screen.

When you update the app, bump `V` in `sw.js` (e.g. regulars-v2) so users get the new files.
