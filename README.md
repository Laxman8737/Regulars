# Bahi | Shop ledger & GST bills
Installable web app (PWA) for Android, iPhone and computers. Backend: Firebase (Auth + Firestore).

## 1. Firebase set-up (one time)
1. Authentication -> Sign-in method: turn ON **Email/Password**, and inside it turn ON **Email link (passwordless sign-in)**. Turn ON **Google**.
   The email link is used for the first-time Google/Apple confirmation and for the account-delete confirmation.
2. Apple (optional): needs a paid Apple Developer account. Enable the Apple provider in Firebase, then set `apple:true` in `window.APP` in `index.html`.
3. Authentication -> Settings -> Authorized domains: add `laxman8737.github.io`.
4. Firestore -> Rules: paste the rules from the chat (verified owner only), Publish.
5. Capacity: the free Spark plan allows 50,000 reads and 20,000 writes per day for ALL users together. For hundreds of shops
   and 100,000 customers per shop, upgrade to **Blaze** (pay as you go) and set a budget alert.

## 1b. 4-digit email OTP (optional, recommended)
Folder `otp-server/` holds the server code. Follow `otp-server/DEPLOY.md` (needs the Blaze plan). Until it is deployed the app
automatically falls back to emailed links. Do NOT upload `otp-server/` to GitHub Pages.

## 2. Publish
Upload every file in this folder to the top level of your GitHub repo. Settings -> Pages -> Deploy from a branch -> main / (root).
Each release: change `bahi-v1` to `bahi-v2` in `sw.js` so users get the new files.

## 3. Where to change what
| What | Where |
|---|---|
| App name, tagline, owner name, support email, year, version | `window.APP = {...}` near the top of `index.html` (head) |
| Name in browser tab / install name | `<title>` in `index.html` and `name`, `short_name` in `manifest.webmanifest` |
| Logo | `icon-*.png`, `apple-touch-icon.png`, `favicon.png`, and the inline `<svg class="logo">` in `index.html` (2 places) |
| Colours | `:root{...}` (light) and `:root[data-theme="dark"]{...}` in the `<style>`; `--accent` is the main colour; tab-bar red is `.tab[aria-selected=true]` |
| Privacy Policy / Terms / Support text | `<dialog id="privacyDlg">`, `termsDlg`, `supportDlg` in `index.html` |
| GST rates offered, HSN presets, state list | bill script: `.map(x=>...[0,5,12,18,28,40])`, button `bAddPerfume`, object `ST` |
| Shop name, address, GSTIN | in the app: Make bill -> Shop & GST details (saved on that device) |
| Firebase keys | `firebaseConfig` in `index.html` (unchanged) |
