# Important patient WhatsApp notifications

- Booking request: one acknowledgement after submission; booking confirmed or rejected: one message about the receptionist decision.
- Payment received (cash/UPI/verified online payment): send a plain-text receipt notification with receipt ID and amount.
- Report approved by the assigned pathologist: send a plain-text report-ready notification.
- Technician accepts/rejects an assignment: visible to the receptionist in the dashboard only; no patient message. Reassignment remains available after rejection.
- Receptionist generates the receipt PDF: send a separate plain-text receipt-ready notification after the PDF response finishes successfully. An atomic claim prevents concurrent/repeated downloads from resending an already accepted message. Failed sends can be tried again on a later download; abandoned claims expire after 60 seconds.
- Sample collection and routine processing: app only.

All patient lifecycle notifications are plain text. Patients download receipts and signed reports from their dashboard. Subsequent receipt downloads do not resend a successfully accepted receipt-ready notification. Notification failures do not roll back saved actions. SENT means API acceptance, not confirmed delivery; no automatic retry queue is implemented.

## Meta configuration

Patient notifications use plain text for booking requests, confirmations, and rejections. Receipt and report-ready notifications also use plain text, with instructions to download from the patient dashboard. Template environment variables are ignored for outgoing messages.

WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID identify the sending business account. The recipient is the patient's booking phone number. Meta allows these non-template messages only within the customer-service window opened by a patient messaging the registered API business number; submitting a website booking does not open this window. Outside that window Meta requires an approved template, so plain-text-only notifications cannot provide proactive delivery at arbitrary times.

Restart the backend after environment changes. No real patient messages are sent by tests.

## Verification

Run: node --test tests/patientNotifications.test.js tests/whatsappDocuments.test.js

Tests cover payment capture/retries, suppressed sample updates, PDF approval/payment guards, media upload and plain-text/document payloads, and provider failure handling. Set PDF_QA_OUTPUT to an output directory to render demo PDFs during the document test.

## Receipt and report email

Payment recorded as Paid sends the receipt PDF to booking.email, with populated account email as a fallback. Pathologist approval sends the final report PDF to booking.email, with report.userId.email as a fallback. Booking submission, confirmation and rejection do not add email notifications. WhatsApp stays plain text.

SMTP attaches the PDF buffer directly; Resend sends the same bytes as a base64 attachment over HTTPS. Email delivery uses the existing email configuration and logs failed acceptance. Notification failure never rolls back payment or report approval, and each channel is attempted independently. No automatic retries are implemented. Live inbox delivery requires working email credentials and a supported sending host.
