# Workflow verification — 17 October 2026

All checks executed in this run passed. This is a regression check, not a guarantee that every possible production scenario is covered.

| Check | Result |
| --- | --- |
| Backend automated tests | 109 passed, 0 failed |
| Frontend automated tests | 11 passed, 0 failed |
| Frontend ESLint | Passed |
| Production build | Passed |
| Backend JavaScript syntax | 72 files checked, 0 failures |
| Live database status consistency | 82 bookings checked read-only, 0 mismatches |
| Local backend health | HTTP 200 |
| Unauthenticated API access | Admin, receptionist, technician, pathologist and patient booking endpoints returned HTTP 401 |

## Automated coverage

Registration, profile validation, booking confirmation and legacy statuses, appointment completion, arrival after technician acceptance, paid-before-arrival technician requests, payment eligibility and verification, duplicate payment handling, templates and package parameters, draft and submitted report validation, review warnings, report pagination, PDF access restrictions, email and WhatsApp service behavior.

## Browser checks

Headless Edge used mocked API responses so that browser actions did not change live records or send patient messages.

- Receptionist: five tabs, booking confirmation, cancellation of rejection, booking details and Escape, online payment guard, offline payment recording, automatic assignment before arrival after payment, rejected technician and rejection reason, reassignment button availability, accepted assignment status, walk-in creation, history search, mobile overflow, and no runtime page errors.
- Arrival buttons remain in Appointments; automatic assignment buttons remain in Technician assignments.
- Patient: Book Tests, Booking History, Reports & Receipts.
- Admin: Available Tests, Add New Test, Report Templates, Health Packages, Dashboard.
- Technician: Assignment Requests, Sample Queue, Result Entry, Corrections, Submitted Reports.
- Pathologist: Pending Review, Approved Reports, Corrections, Digital Signature, Monthly Report.
- Unauthenticated dashboard navigation redirects to login.

The 18 non-receptionist sections were checked for navigation and rendering with empty mocked datasets. Those checks do not establish successful record creation or submission through every form.

## Limits and remaining external verification

No real payment was taken, patient notification sent, or live clinical report submitted/approved during this run. External Razorpay processing, actual email/WhatsApp delivery, and a complete authenticated multi-role workflow against the live backend were not exercised end to end. Notification and payment behavior were verified with automated mocks.

Build warnings remain for outdated Browserslist data and a JavaScript bundle above 500 kB. They did not fail the build.

Raw backend test output: `tmp/full-backend-tests.txt`. Browser scripts: `tmp/ui-check/reception.cjs` and `tmp/ui-check/dashboards.cjs`.
