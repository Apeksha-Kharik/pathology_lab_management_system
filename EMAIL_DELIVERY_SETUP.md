# Registration email on Render

Render Free web services block outbound SMTP ports 25, 465 and 587. The app supports Resend over HTTPS without changing registration or OTP verification. Existing SMTP delivery remains available on hosts that support it.

## Configure the backend service

1. Deploy the updated backend source to the existing Render backend service.
2. In Resend, verify a sender domain and create an API key with sending permission. A test sender is restricted and is not suitable for arbitrary patient recipients.
3. In Render backend Environment, set these values (never put the API key in frontend variables or Git):

```dotenv
EMAIL_PROVIDER=resend
RESEND_API_KEY=your-secret-key
EMAIL_FROM=IndiPath <notifications@your-verified-domain.example>
NODE_ENV=production
ALLOW_DEV_OTP=false
```

4. Save the environment and redeploy/restart the backend. Startup should show `HTTPS email provider configured`.
5. Register using your own unused email address, check the inbox/spam folder, verify the emailed OTP, then log in. The account is created only after verification.
6. Check Render backend logs for `HTTPS email accepted` or an error status/code. Acceptance is not confirmed inbox delivery.

Local development can use the same HTTPS configuration in ignored backend/.env. Its SMTP EMAIL_USER, EMAIL_PASS and EMAIL_FROM must be populated if using SMTP instead.

## Checks

```powershell
node --test backend/tests/emailService.test.js backend/tests/registration.test.js
```

These tests mock delivery and do not send real email.

References: https://render.com/docs/free and https://resend.com/docs/api-reference/emails/send-email
