# Important patient WhatsApp notifications

- Booking request: one acknowledgement after submission; booking confirmed or rejected: one message about the receptionist decision.
- Payment received (cash/UPI/verified online payment): send a plain-text receipt notification with receipt ID and amount.
- Report approved by the assigned pathologist: send a plain-text report-ready notification.
- Sample collection and routine processing: app only.

All patient lifecycle notifications are plain text. Patients download receipts and signed reports from their dashboard. Downloading a PDF does not resend a notification. Notification failures do not roll back saved actions. SENT means API acceptance, not confirmed delivery; no automatic retry queue is implemented.

## Meta configuration

Patient notifications use plain text for booking requests, confirmations, and rejections. Receipt and report-ready notifications also use plain text, with instructions to download from the patient dashboard. Template environment variables are ignored for outgoing messages.

WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID identify the sending business account. The recipient is the patient's booking phone number. Meta allows these non-template messages only within the customer-service window opened by a patient messaging the registered API business number; submitting a website booking does not open this window. Outside that window Meta requires an approved template, so plain-text-only notifications cannot provide proactive delivery at arbitrary times.

Restart the backend after environment changes. No real patient messages are sent by tests.

## Verification

Run: node --test tests/patientNotifications.test.js tests/whatsappDocuments.test.js

Tests cover payment capture/retries, suppressed sample updates, PDF approval/payment guards, media upload and plain-text/document payloads, and provider failure handling. Set PDF_QA_OUTPUT to an output directory to render demo PDFs during the document test.
