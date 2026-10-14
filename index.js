// Bahi - 4-digit email OTP (server side). Deploy with Firebase Cloud Functions (Blaze plan).
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();
const GMAIL_USER = defineSecret("GMAIL_USER");
const GMAIL_APP_PASSWORD = defineSecret("GMAIL_APP_PASSWORD");
const OTP_PEPPER = defineSecret("OTP_PEPPER");
const OPTS = { region: "asia-south1", secrets: [GMAIL_USER, GMAIL_APP_PASSWORD, OTP_PEPPER], maxInstances: 20 };
const PURPOSES = { signup: "verify your email", first: "confirm your first sign-in", delete: "confirm deleting your account" };

const hash = (uid, purpose, code) =>
  crypto.createHash("sha256").update([uid, purpose, code, OTP_PEPPER.value()].join(":")).digest("hex");
const mailer = () =>
  nodemailer.createTransport({ service: "gmail", auth: { user: GMAIL_USER.value(), pass: GMAIL_APP_PASSWORD.value() } });
const need = (req) => {
  if (!req.auth || !req.auth.token.email) throw new HttpsError("unauthenticated", "Please sign in first.");
  const purpose = req.data && req.data.purpose;
  if (!PURPOSES[purpose]) throw new HttpsError("invalid-argument", "Unknown request.");
  return { uid: req.auth.uid, email: req.auth.token.email, purpose };
};

exports.sendOtp = onCall(OPTS, async (req) => {
  const { uid, email, purpose } = need(req);
  const ref = db.doc("otps/" + uid), now = Date.now(), day = new Date().toISOString().slice(0, 10);
  const old = (await ref.get()).data() || {};
  if (old.sentAt && now - old.sentAt < 30000) throw new HttpsError("resource-exhausted", "Please wait 30 seconds before asking for another code.");
  const count = old.day === day ? old.count || 0 : 0;
  if (count >= 10) throw new HttpsError("resource-exhausted", "Too many codes today. Please try again tomorrow.");
  const code = String(crypto.randomInt(0, 10000)).padStart(4, "0");
  await ref.set({ h: hash(uid, purpose, code), purpose, exp: now + 10 * 60 * 1000, tries: 0, sentAt: now, day, count: count + 1 });
  try {
    await mailer().sendMail({
      from: '"Bahi" <' + GMAIL_USER.value() + ">", to: email, subject: "Your Bahi code: " + code,
      text: "Your Bahi code is " + code + ". Use it to " + PURPOSES[purpose] + ". It works for 10 minutes. Never share it with anyone.",
      html: '<div style="font-family:Arial,sans-serif"><p>Use this code to ' + PURPOSES[purpose] + ":</p><p style=\"font-size:32px;letter-spacing:8px;font-weight:700\">" + code + "</p><p>It works for 10 minutes. Never share it with anyone.</p></div>",
    });
  } catch (e) { console.error(e); throw new HttpsError("internal", "We could not send the email. Please try again."); }
  return { ok: true };
});

exports.verifyOtp = onCall(OPTS, async (req) => {
  const { uid, purpose } = need(req);
  const code = String((req.data && req.data.code) || "");
  if (!/^\d{4}$/.test(code)) throw new HttpsError("invalid-argument", "Enter the 4-digit code.");
  const ref = db.doc("otps/" + uid), snap = await ref.get();
  if (!snap.exists) throw new HttpsError("failed-precondition", "No code was requested. Ask for a new one.");
  const d = snap.data();
  if (d.purpose !== purpose || Date.now() > d.exp) { await ref.delete(); throw new HttpsError("deadline-exceeded", "This code has expired. Ask for a new one."); }
  if (d.tries >= 5) { await ref.delete(); throw new HttpsError("resource-exhausted", "Too many wrong tries. Ask for a new code."); }
  const ok = crypto.timingSafeEqual(Buffer.from(hash(uid, purpose, code)), Buffer.from(d.h));
  if (!ok) { await ref.update({ tries: d.tries + 1 }); throw new HttpsError("permission-denied", "That code is not correct. " + (4 - d.tries) + " tries left."); }
  await ref.delete();
  if (purpose === "signup") await admin.auth().updateUser(uid, { emailVerified: true });
  if (purpose === "first") await db.doc("users/" + uid + "/meta/profile").set({ confirmed: true }, { merge: true });
  if (purpose === "delete") { await db.recursiveDelete(db.doc("users/" + uid)); await admin.auth().deleteUser(uid); }
  return { ok: true };
});
