# Bahi | Shop ledger & GST bills
Installable web app (PWA) for Android, iPhone and computers. Backend: Firebase (Auth + Firestore).

## 1. Firebase set-up (one time)
1. Authentication -> Sign-in method -> Email/Password -> turn ON **Email link (passwordless sign-in)**. Login and account-delete links depend on it.
2. Authentication -> Settings -> Authorized domains: add `laxman8737.github.io`.
3. Firestore -> Rules: paste the rules from the chat (verified owner only), Publish.
4. Capacity: the free Spark plan allows 50,000 reads and 20,000 writes per day for ALL users together. For hundreds of shops
   and 100,000 customers per shop, upgrade to **Blaze** (pay as you go) and set a budget alert.

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
