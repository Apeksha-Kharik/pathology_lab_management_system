# Important patient WhatsApp notifications

- Booking request: one acknowledgement after submission; booking confirmed or rejected: one message about the receptionist decision.
- Payment received (cash/UPI/verified online payment): generate and attach the receipt PDF.
- Report approved by the assigned pathologist: generate and attach the final report PDF, including its signature.
- Sample collection and routine processing: app only.

PDF generation reuses the patient download renderers. Attachments are uploaded directly to Meta, then sent using a media ID; patient PDFs are not exposed through public links. Downloading a PDF does not resend it. Payment/approval saves are not rolled back if generation or delivery fails. Failures are logged; no automatic retry queue is implemented. SENT means API acceptance, not a delivery receipt. Repeated sequential payment updates do not resend; concurrent processing is not guaranteed exactly once.

## Meta configuration

For proactive delivery outside the 24-hour customer-service window, create approved Utility templates with a DOCUMENT header. Set their approved names in backend/.env:

- WHATSAPP_TEMPLATE_BOOKING_REQUEST: body parameters in order: patient name, booking ID, test/package, date, time slot, amount.
- WHATSAPP_TEMPLATE_BOOKING_CONFIRMED: body parameters in order: patient name, patient ID, booking ID, test/package, date, time slot, amount.
- WHATSAPP_TEMPLATE_BOOKING_REJECTED: body parameters in order: patient name, booking ID, test/package, rejection reason.
- WHATSAPP_TEMPLATE_RECEIPT_DOCUMENT: body parameters in order: patient name, booking ID, amount. Suggested body: Hello {{1}}, payment of {{3}} for booking {{2}} has been received. Your receipt is attached.
- WHATSAPP_TEMPLATE_REPORT_DOCUMENT: body parameters in order: patient name, booking ID. Suggested body: Hello {{1}}, your approved report for booking {{2}} is attached.
- WHATSAPP_TEMPLATE_LANGUAGE must match the approved language (default en_US).

For a temporary delivery demo, WHATSAPP_TEMPLATE_HELLO overrides the booking request template and sends that approved template without parameters. Remove it after the demo and restart the backend to resume the booking request template.

Leave the document template names blank only for testing within an active customer-service window. Existing text-only payment/report templates cannot carry the PDF header. Booking request/confirmation/rejection require approved text templates for proactive delivery.

Restart the backend after environment changes. No real patient messages are sent by tests.

## Verification

Run: node --test tests/patientNotifications.test.js tests/whatsappDocuments.test.js

Tests cover payment capture/retries, suppressed sample updates, PDF approval/payment guards, media upload and document-template payloads, and provider failure handling. Set PDF_QA_OUTPUT to an output directory to render demo PDFs during the document test.
