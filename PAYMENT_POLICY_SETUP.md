# Payment policy setup

Public policy routes are defined in `frontend/src/data/policies.js` and linked from the homepage footer. These pages do not implement Razorpay checkout or refunds.

The default commercial rules requested for this implementation are:

- Full refund for cancellation before sample collection.
- After collection, refund unused services with only previously disclosed, itemised deductions for work performed.
- Refund duplicate charges, overcharges and unfulfilled lab-cancelled services.
- Request within 7 calendar days, without limiting statutory rights or later-discovered issues.
- Review target: 2 business days after receiving necessary information.
- Initiate approved refunds within 5 business days; estimated bank credit takes an additional 5–7 business days.

Before accepting live payments, verify that the lab can honour these commitments. Confirm the legal name and support details reused from the homepage, add the complete registered street address to `business.address`, and confirm medical-record retention practices and grievance handling. Have the final policies reviewed for your actual operations and applicable obligations. These pages do not guarantee gateway approval.

Prices currently remain in the existing booking flow. Confirm actual services and prices are available to gateway reviewers; do not invent public prices. Test-specific turnaround times should be disclosed before payment.

Render must have a static-site rewrite from `/*` to `/index.html` so public policy URLs open directly and survive refreshes.

Test Mode checkout now links the terms, privacy and refund policies before payment and verifies payments server-side. See [RAZORPAY_SETUP.md](RAZORPAY_SETUP.md) for configuration and testing. Refund processing and refund reconciliation still need implementation before live use.

References: https://razorpay.com/terms/ and https://razorpay.com/dispute-guide/
