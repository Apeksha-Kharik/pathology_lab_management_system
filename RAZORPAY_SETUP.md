# Razorpay Test Mode integration

This extends the existing application; it does not create another booking or a separate payment project. Real Razorpay Test Mode orders and Standard Checkout are used. No real funds move in Test Mode. The backend deliberately rejects keys that do not start with `rzp_test_`.

## Existing architecture inspected

| Area | Existing implementation |
| --- | --- |
| Frontend | React/Vite, React Router, Tailwind, shared Axios client in `frontend/src/services/api.js` |
| Active booking and patient history | `frontend/src/pages/PatientDashboard.jsx`; the standalone `BookTest.jsx` and `History.jsx` are not mounted by `App.jsx` |
| Backend | Express, CommonJS modules, entry point `backend/index.js`; `server.js` forwards to it |
| Authentication | JWT Bearer token, `protect` loads the user, `allowRoles` checks patient/receptionist roles |
| Booking | Existing `Booking` MongoDB model, including owner, test/package, database-derived amount, `bookingStatus`, `paymentStatus`, dates and receipt fields |
| Booking API | `POST /book-test` (also `/bookings`), `GET /bookings`; requires patient authentication |
| Confirmation | Receptionist `PATCH /api/receptionist/bookings/:id/status`; sets `Confirmed` and patient code |
| Billing | Existing `Payment` model, receptionist manual payment recording and patient/receptionist PDF receipts |

## Files

Created for this integration:

- `backend/controllers/onlinePaymentController.js`
- `backend/services/razorpayService.js`
- `backend/tests/onlinePayment.test.js`
- `frontend/src/components/BookingPayment.jsx`
- `frontend/src/services/onlinePaymentService.js`
- `frontend/src/utils/paymentEligibility.js`
- `frontend/tests/paymentEligibility.test.js`
- `RAZORPAY_SETUP.md`

Modified:

- `.gitignore` — ignores `.env` and `.env.*`, permits safe `.env.example` templates.
- `backend/.env.example` — blank secret placeholders and Razorpay variables.
- `backend/package.json`, `backend/package-lock.json` — official `razorpay` SDK (`^2.9.8`) and payment test command; npm also resolves its transitive dependencies.
- `backend/models/Booking.js` — payment preference, gateway identifiers, mode and order-creation lock.
- `backend/models/Payment.js` — permits `razorpay` as payment method.
- `backend/controllers/patientController.js` — stores preference, keeps existing catalog pricing and labels test receipts.
- `backend/controllers/receptionistController.js` — protects confirmation transitions, prevents manual settlement of online bookings and labels test receipts.
- `backend/routes/patientRoutes.js` — authenticated payment routes.
- `backend/index.js` — raw-body webhook before JSON parsing.
- `frontend/.env.example` — contains only the public API URL; backend credentials removed.
- `frontend/src/pages/PatientDashboard.jsx` — payment choice, review text, automatic history refresh and checkout actions.
- `frontend/src/pages/ReceptionistDashboard.jsx` — displays payment choice and keeps manual collection for cash bookings.
- `PAYMENT_POLICY_SETUP.md` — links to this integration guide.

No frontend npm package was added. Checkout.js loads from Razorpay's official domain only when Pay Now is clicked. Local `.env` values have not been filled or changed by this integration.

## Environment configuration

Add these to your ignored **local `backend/.env`**, and separately to **Render → pathology-lab-backend → Environment**:

```dotenv
RAZORPAY_KEY_ID=<your Test Mode public key ID, starting rzp_test_>
RAZORPAY_KEY_SECRET=<your Test Mode API secret>
RAZORPAY_WEBHOOK_SECRET=<a separate random secret you also enter in the webhook dashboard>
```

The first two enable checkout. The third enables signed webhook recovery. Do not paste angle-bracket placeholders as real values. Never add any of these secrets to frontend files or GitHub. Keep existing MongoDB, JWT, email and `FRONTEND_URL` settings.

**No Razorpay frontend environment variable is required.** The authenticated create-order response supplies only the public Key ID. The existing frontend `VITE_API_URL` remains `https://pathology-lab-backend-pcb1.onrender.com`.

Tracked example files previously contained credentials. Their current contents have been sanitised, but this does not remove old Git history; rotate any real exposed database/email/JWT credentials separately.

## Razorpay Dashboard and Render steps

1. Log in to Razorpay and select **Test Mode**.
2. Open **Account & Settings → Website and app settings → API Keys → Generate Key**. Save the Test Mode key ID and secret securely. [Official API key instructions](https://razorpay.com/docs/payments/dashboard/account-settings/api-keys/).
3. Add the keys to local backend `.env` and Render backend Environment. Generate a separate webhook secret and add it there too. Save and redeploy the backend.
4. In Razorpay, open **Account & Settings → Payments Capture**. Keep/select **Automatic Capture** and save the settings. This implementation requires a captured payment, not merely an authorised one. [Capture settings](https://razorpay.com/docs/payments/payments/capture-settings/).
5. Still in Test Mode, open **Account & Settings → Website and app settings → Webhooks → Add New Webhook**.
6. Enter this exact URL:

   ```text
   https://pathology-lab-backend-pcb1.onrender.com/api/payments/razorpay/webhook
   ```

7. Enter the same secret used in `RAZORPAY_WEBHOOK_SECRET`, your alert email and select **`payment.captured`**. Click **Create Webhook** and ensure it is enabled. [Official webhook setup](https://razorpay.com/docs/webhooks/setup-edit-payments/).
8. Commit and push the source changes, including the backend lockfile and new files, but no `.env` files. Wait for **both** Render services to deploy the latest commit. Use Manual Deploy if automatic deployment does not start. Hard-refresh the frontend.

## API endpoints

| Method and path | Auth | Purpose |
| --- | --- | --- |
| `POST /bookings/:id/payment/order` | Patient JWT; must own booking | Accepts the existing MongoDB booking ID in the URL. No client amount is used. Creates/reuses the booking's Test Mode order, or reconciles a previously captured payment. |
| `POST /bookings/:id/payment/verify` | Patient JWT; must own booking | Body contains `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`. Validates HMAC and fetches the payment to check order, amount, INR currency and captured status. |
| `POST /api/payments/razorpay/webhook` | Raw-body HMAC signature | Handles `payment.captured` and updates only the booking matching its stored order ID. It does not need a patient JWT. |

The create-order response contains `key`, `orderId`, `amount` in paise, `currency` and `mode`. Already-paid bookings cannot start checkout. A lost browser callback can produce `{ paid: true, booking }` when the existing captured order is reconciled.

Missing/foreign bookings return 404. Invalid responses/amounts return 400; ineligible states return 409; unconfigured payment service returns 503; gateway failures return 502. Secrets and raw gateway error payloads are not returned.

## Booking flow

1. Patient chooses a real test/package in the existing booking wizard and selects **Cash on delivery** or **Online payment**.
2. Existing booking creation saves the catalog-derived amount and the preference. It remains **Pending Approval / Unpaid**. There is no Pay Now button yet.
3. Receptionist confirms it. The status becomes **Confirmed**. Confirmation does not mark it paid.
4. Patient opens **Booking History**. It refreshes on opening, returning to the tab, and every 15 seconds while visible. Only online bookings with **Confirmed** or **Arrived** status and **Unpaid/Failed** payment status show **Pay Now** in the Payment column.
5. Checkout uses an order created from that booking's database amount, with a minimum of INR 1 (100 paise). The browser cannot choose the amount.
6. Checkout success is sent to the verification endpoint. Valid signatures alone are insufficient: the server also checks the captured payment, order ID, amount and currency through Razorpay.
7. The same booking becomes **Paid**, the existing Payment record is updated, and receipt fields are populated. The button disappears. Test payments and downloaded PDF receipts are labelled as tests.
8. Receptionist marks arrival and continues the existing paid/arrived technician workflow. Online payment cannot be manually marked paid by receptionists. Cash bookings keep their existing manual payment flow.

Existing bookings default to cash, so test this with a **new online booking**. Local-only historical/demo rows never show Pay Now. Test payments still exercise your normal paid workflow; use test patients and do not count them as real revenue.

## MongoDB changes

No collection was added and no migration is required for old cash bookings.

New Booking fields:

| Field | Meaning |
| --- | --- |
| `paymentPreference` | `cash` (default) or `online`; separate from actual payment method |
| `razorpayOrderId` | One reusable order attached to this booking |
| `razorpayPaymentId` | Captured, verified payment ID |
| `razorpayMode` | `test` in this implementation |
| `paymentOrderLock`, `paymentOrderLockUntil` | Short-lived database lock for concurrent order creation; excluded from normal queries and cleared afterward |

After success, the existing booking has `paymentStatus: "Paid"`, `paymentMethod: "razorpay"`, order/payment IDs, `razorpayMode: "test"`, `paymentDate`, `paidAt`, `receiptId` and `receiptNumber`. The existing Payment document has `status: "paid"`, `method: "razorpay"`, `transactionId` and matching amount/date/receipt fields. No new booking or duplicate payment record is created. Card numbers, CVV, UPI PINs, bank passwords and checkout credentials are never stored.

Atomic conditional booking updates prevent repeat settlement. Repeated verified callbacks/webhooks refresh the same Payment record and preserve the original paid date and receipt. If billing persistence fails after the booking update, a webhook retry repairs it. Keep the webhook enabled; monitor backend errors and webhook deliveries for reconciliation issues.

## Test the complete flow

Use Test Mode keys only. Do not enter real card or bank credentials. [Razorpay's Standard Checkout testing instructions](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/) describe the simulated bank Success/Failure screen.

1. Log in as a test patient. Book a test with **Online payment**. Verify history shows Pending Approval/Unpaid without Pay Now.
2. In another browser/incognito session, log in as receptionist and confirm that exact booking.
3. Return to patient Booking History. Within the next refresh, Pay Now should appear for that booking.
4. Click Pay Now. Confirm the amount matches the selected booking and the checkout is in Test Mode.
5. Choose **Netbanking**, select a listed bank and click **Success** on Razorpay's simulated bank screen. Do not use a real banking login.
6. Verify **Paid**, no Pay Now, and a receipt in Downloads. In Razorpay **Transactions → Payments**, confirm the payment is captured in Test Mode. Check MongoDB fields listed above.
7. Make another online booking, confirm it, then close checkout. It should remain unpaid and show a cancellation message. Retry opens the same order.
8. On another confirmed online booking, choose **Failure** on the simulated bank page. The UI displays a failure message and never claims Paid. Failed attempts remain unpaid locally until a successful verified payment is captured.
9. Create a **Cash on delivery** booking and confirm it. It must never display Pay Now. Receptionist can still collect and record offline payment.
10. Refresh after a successful payment and try opening the booking in a second tab. It remains Paid; another payment order is refused.
11. To test recovery, complete a Test Mode payment and close the patient tab before the normal callback completes. Check that `payment.captured` webhook delivery receives a 2xx response and the booking becomes Paid on reopening. A retried Pay Now also checks the existing order for captured payments before opening checkout.
12. Check missing-key handling by testing locally with the Razorpay variables absent: booking creation still works, but Pay Now shows a configuration error without marking anything paid. Restore the variables and restart the backend.

Do not switch to live keys for these tests. Test Mode transactions do not settle money. Refund processing/refund webhooks and changing an online booking to cash are not implemented here; handle policy requests with the lab and gateway dashboard, and implement refund reconciliation before a live launch.

## Automated validation

From `backend`: `npm run test:payments`.

From `frontend`: `node --test tests/paymentEligibility.test.js` and `npm run build`.

Backend tests mock the external gateway and database boundaries to exercise validation, order reuse, concurrent requests, signature checks, confirmation, captured-payment checks, and webhook recovery. These mocks are test-only; production code calls the real Razorpay SDK. Automated tests are not proof of an account-specific gateway transaction. Perform the manual Test Mode flow above after setting your own keys.

The dependency audit also reports advisories in existing backend dependencies (Express/body-parser/qs, Mongoose, Multer and Nodemailer). No broad or breaking dependency upgrade was made as part of the payment integration.

## Later: moving to Live Mode

Do not change this now. After Test Mode succeeds, complete Razorpay activation/website checks and verify your business/policy details. A deliberate code change must replace the test-only guard in `razorpayService.js`, set the correct gateway mode when creating orders, and change the Test Mode UI labels. Merely adding live keys will currently be rejected.

Configure Live Mode keys and a separate Live Mode webhook/secret in the backend environment. Use fresh live bookings/orders and keep test records distinct; never convert simulated Paid records into real payments or reuse test orders with live keys. Add refund reconciliation and review outstanding captured/failed webhook events, then perform a controlled live transaction and refund verification before offering payments publicly.
