# Turn on 4-digit email OTP (one-time, about 15 minutes)

Without this, the app still works and falls back to emailed links. With it, signup, first Google/Apple sign-in and
account deletion ask for a 4-digit code emailed to the user. Codes are made, stored (hashed) and checked on the server.

## 1. Upgrade Firebase to Blaze
Firebase console -> Usage and billing -> Modify plan -> Blaze. Add a budget alert (e.g. Rs. 500). Small apps stay near zero cost.

## 2. Make a Gmail app password (this is the sender)
Google Account -> Security -> turn on 2-Step Verification -> App passwords -> create one named "Bahi". Copy the 16 letters.
(Gmail allows roughly 500 emails a day. For more users, use a mail service such as SendGrid and change `mailer()` in functions/index.js.)

## 3. Deploy from Google Cloud Shell (works in a phone browser)
1. Open https://shell.cloud.google.com and sign in with the same Google account as Firebase.
2. Upload the `otp-server` folder (menu -> Upload), then:
```
cd otp-server
firebase login --no-localhost
firebase use regulars-shop
firebase functions:secrets:set GMAIL_USER          # type your Gmail address
firebase functions:secrets:set GMAIL_APP_PASSWORD  # paste the 16-letter app password
firebase functions:secrets:set OTP_PEPPER          # type any long random text
firebase deploy --only functions
```
3. When it finishes you will see `sendOtp` and `verifyOtp` in Firebase console -> Functions.

## 4. Check
Open the app, sign up with a real email: a 4-digit code arrives. If the app says the email could not be sent,
re-check the Gmail address and app password (step 3 secrets).
