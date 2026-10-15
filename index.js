// Bahi - 4-digit email OTP (server side). Deploy with Firebase Cloud Functions (Blaze plan).
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();
const GMAIL_USER = defineSecret("GMAIL_USER");
const GMAIL_APP_PASSWORD = defineSecret("GMAIL_APP_PASSWORD");
const OTP_PEPPER = defineSecret("OTP_PEPPER");
const ENFORCE = process.env.ENFORCE_APPCHECK === "true"; // set in functions/.env after enabling App Check (SECURITY.md)
const OPTS = { enforceAppCheck: ENFORCE, region: "asia-south1", secrets: [GMAIL_USER, GMAIL_APP_PASSWORD, OTP_PEPPER], maxInstances: 20 };
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

// ---------- Send a bill on WhatsApp (WhatsApp Cloud API, approved template) ----------
const WA_TOKEN = defineSecret("WA_TOKEN");
const WA_PHONE_ID = defineSecret("WA_PHONE_ID");
const WA_TEMPLATE = defineString("WA_TEMPLATE", { default: "bill_notification" });
const WA_LANG = defineString("WA_LANG", { default: "en" });
const clean = (v, n) => String(v || "").replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim().slice(0, n);

exports.sendBill = onCall({ enforceAppCheck: ENFORCE, region: "asia-south1", secrets: [WA_TOKEN, WA_PHONE_ID], maxInstances: 20 }, async (req) => {
  if (!req.auth || req.auth.token.email_verified !== true) throw new HttpsError("unauthenticated", "Please sign in with a verified email.");
  const uid = req.auth.uid, d = req.data || {}, to = String(d.to || "");
  if (!/^[6-9]\d{9}$/.test(to)) throw new HttpsError("invalid-argument", "The customer's number is not a valid 10-digit mobile number.");
  const p = [clean(d.name, 40) || "Customer", clean(d.shop, 40) || "our shop", clean(d.inv, 20), clean(d.date, 12), clean(d.total, 12), clean(d.items, 600) || "-"];
  if (!p[2] || !p[4]) throw new HttpsError("invalid-argument", "Bill details are missing.");
  // only numbers saved under this shop's own customers (stops misuse of the shared WhatsApp number)
  const own = await db.collection("users/" + uid + "/customers").where("phone", "in", [to, "+91" + to, "91" + to]).limit(1).get();
  if (own.empty) throw new HttpsError("permission-denied", "This number is not saved under your customers. Edit the customer and save the 10-digit number.");
  // rate limit: 20 a minute, 1000 a day per shop
  const rl = db.doc("sendRate/" + uid), now = Date.now(), minute = Math.floor(now / 60000), day = new Date().toISOString().slice(0, 10);
  const r = (await rl.get()).data() || {}, m = r.minute === minute ? r.m : 0, dd = r.day === day ? r.d : 0;
  if (m >= 20) throw new HttpsError("resource-exhausted", "Too many bills in one minute. Please wait a moment.");
  if (dd >= 1000) throw new HttpsError("resource-exhausted", "Daily sending limit reached. Try again tomorrow.");
  await rl.set({ minute, m: m + 1, day, d: dd + 1 });
  const res = await fetch("https://graph.facebook.com/v20.0/" + WA_PHONE_ID.value() + "/messages", {
    method: "POST", headers: { Authorization: "Bearer " + WA_TOKEN.value(), "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: "91" + to, type: "template",
      template: { name: WA_TEMPLATE.value(), language: { code: WA_LANG.value() }, components: [{ type: "body", parameters: p.map((t) => ({ type: "text", text: t })) }] } }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.messages) { console.error(JSON.stringify(j)); throw new HttpsError("failed-precondition", "WhatsApp could not send it: " + ((j.error && j.error.message) || "unknown error")); }
  await db.collection("users/" + uid + "/bills").add({ inv: p[2], to, total: p[4], waId: j.messages[0].id, at: admin.firestore.FieldValue.serverTimestamp() });
  return { ok: true, id: j.messages[0].id };
});
