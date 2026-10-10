# Regulars - customer ledger for local shops
Built by Ram Laxman Shastry Jagarlapudi - https://laxman8737.github.io/

FILES
- index.html     the whole app in ONE file (upload this)
- firestore.rules database security rules
- source/        same app split into css/ and js/ for editing on a computer

SETUP (browser only, no coding)
1. Firebase console (console.firebase.google.com, use "Desktop site" on a phone):
   Add project > add Web app (</>) > copy the firebaseConfig block.
   Authentication > enable Email/Password and Google.
   Firestore Database > Create database (production mode) > Rules > paste firestore.rules > Publish.
2. GitHub: new repository > Add file > Upload files > index.html.
   Settings > Pages > Branch main / root > Save.
3. Open https://laxman8737.github.io/<repo-name>/ . Paste the firebaseConfig block in the
   yellow "One-time setup" box and tap Save and continue.
4. Firebase > Authentication > Settings > Authorized domains > add laxman8737.github.io

Never open index.html from your files (file:// or content://) - always use the https link.
