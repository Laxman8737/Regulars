# Send bills automatically on WhatsApp (one-tap, no app redirect)

The bill is sent by a Firebase function through Meta's WhatsApp Cloud API. The customer receives an approved
message template filled with the bill details. The app shows "Sent" only after WhatsApp accepts the message, and shows
WhatsApp's own error text if it does not. (WhatsApp can't tell us when the customer reads it, only that it was accepted.)

Needs: Firebase **Blaze** plan (same as the OTP feature) and a Meta business account.

## 1. Meta app and number
1. Go to https://developers.facebook.com -> My Apps -> Create App -> type **Business** -> add the **WhatsApp** product.
2. WhatsApp -> API Setup: note the **Phone number ID**. Meta gives a free *test number*; you can add up to 5 customer numbers
   to test with right away.
3. For real customers: add your own business phone number (one not already used on WhatsApp) and finish Meta **Business Verification**
   (can take a few days). New accounts start with a daily limit on business-started messages that grows with good use.

## 2. Permanent access token
Business Settings -> Users -> System users -> Add (Admin) -> Assign Assets (your app + WhatsApp account) ->
Generate token with permissions `whatsapp_business_messaging` and `whatsapp_business_management`. Copy it (it does not expire).

## 3. Message template (must be approved by Meta)
WhatsApp Manager -> Message templates -> Create:
- Name: `bill_notification`   Category: **Utility**   Language: English
- Body (exactly 6 variables):
```
Hello {{1}}, thank you for shopping at {{2}}. Your bill {{3}} dated {{4}} is Rs. {{5}}. Items: {{6}}. Please contact us for any questions.
```
- Add sample values for the six variables, then submit. Approval is usually quick for Utility templates.

## 4. Deploy (Cloud Shell, same as DEPLOY.md)
```
cd otp-server
firebase functions:secrets:set WA_TOKEN       # paste the permanent token
firebase functions:secrets:set WA_PHONE_ID    # paste the Phone number ID
firebase deploy --only functions
```
If you used a different template name or language, set them in `functions/.env`:
```
WA_TEMPLATE=your_template_name
WA_LANG=en
```

## 5. Rules of the road
- Only message customers who agreed to receive bills (Meta policy). Meta charges a small fee per template message; check Meta's current India price list.
- The function only sends to numbers saved under the shop's own customers and limits each shop to 20 bills a minute / 1000 a day.
- All shops send from your one business number, with each shop's name inside the message.
