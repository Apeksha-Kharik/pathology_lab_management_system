// Confirm business details and draft commercial terms before accepting live payments.
export const business = {
  name: 'INDIPATH Multidiagnostic LLP',
  email: 'indipathlab@gmail.com',
  phone: '+91 7448231970',
  telephone: '+917448231970',
  address: 'Kankavali, Maharashtra 416 602',
};

export const policies = [
  {
    path: '/privacy-policy', title: 'Privacy Policy',
    summary: 'How information is used when you register, book tests and access laboratory reports.',
    sections: [
      ['Information we handle', 'We collect the details you provide for registration and diagnostic services, including your name, contact details, patient details, booking information, samples and test results. Account and payment records help us manage access, billing and support.'],
      ['Why we use information', 'Information is used to verify accounts, arrange tests, process samples, prepare and release reports, manage payments and respond to requests. Please provide accurate details and only submit another person’s information when you are authorised to do so.'],
      ['Access and sharing', 'Authorised laboratory personnel access information needed for their work. Service providers involved in hosting, email delivery and payment processing may process relevant information. Information may also be disclosed when required by applicable law.'],
      ['Online payments', 'When Razorpay checkout is enabled, payment information entered into checkout is processed by Razorpay and its payment partners under their policies. Booking and transaction references may be retained for reconciliation and refunds. Never send card security codes, UPI PINs or payment OTPs to laboratory support.'],
      ['Browser storage and account security', 'The application uses browser local storage to keep your sign-in token and account session information. Sign out after using a shared device. No internet service can promise absolute security.'],
      ['Retention and your requests', 'Medical, booking and billing records may need to be retained for service delivery and applicable record-keeping obligations. Contact us to request access, correction or deletion, or to raise a privacy concern. Requests may require identity verification; deletion can be limited by legal retention obligations.'],
      ['Children and updates', 'A parent or authorised guardian should arrange services for a child. Updates to this policy will be published on this page. Send privacy requests to the laboratory support email below; the team will route them to the responsible person.'],
    ],
  },
  {
    path: '/terms-and-conditions', title: 'Terms & Conditions',
    summary: 'Conditions for using our website and diagnostic services.',
    sections: [
      ['Our services', 'INDIPATH provides laboratory test booking, sample processing and access to approved diagnostic reports. Availability depends on the selected test, appointment and laboratory capacity.'],
      ['Your responsibilities', 'Provide accurate patient and contact details, protect your login credentials and follow preparation and sample collection instructions. An authorised guardian must act for patients who cannot provide consent themselves.'],
      ['Bookings and prices', 'Check the selected tests, appointment and final amount before confirming a booking. Test and package prices are shown during booking; contact the laboratory for a quotation before proceeding if a price or additional charge is unclear. Payment alone does not confirm sample collection or report completion.'],
      ['Payments', 'Use only payment methods offered by the laboratory. Where online checkout is available, keep your booking and payment references. If money is debited without booking confirmation, contact support before paying again.'],
      ['Samples and reports', 'Unsuitable or insufficient samples may require recollection. Report completion depends on the test, sample quality and clinical review. Reports become available after approval and should be interpreted by a qualified medical practitioner.'],
      ['Cancellations and complaints', 'Read the Cancellation & Refund Policy and Service Delivery Policy before booking. Contact the laboratory for booking changes, billing discrepancies or service complaints. Nothing in these terms removes rights available under applicable law.'],
    ],
  },
  {
    path: '/refund-policy', title: 'Cancellation & Refund Policy',
    summary: 'How to request a cancellation, report a duplicate payment or ask for a refund.',
    sections: [
      ['Requesting a cancellation', 'Contact the laboratory with your booking reference before sample collection begins to cancel for a full refund. You may also request rescheduling, subject to slot availability. Missed appointments are not automatically cancelled; contact support to reschedule or request review.'],
      ['Refund eligibility', 'Duplicate payments, verified overcharges and services cancelled by the laboratory before being performed qualify for a refund of the duplicate, excess or unfulfilled amount. If the laboratory cannot perform your test, you may choose a refund for the unperformed service rather than rescheduling.'],
      ['After sample collection', 'After collection begins, only the unused portion of a booking is refundable. Charges for collection or tests already performed may be deducted only where disclosed before payment, with an itemised explanation. Completed tests are not refundable solely because the result differs from expectations. Concerns about an incorrect or deficient service will be reviewed separately, without limiting your statutory rights.'],
      ['How to submit a request', 'Email or call support with your booking ID, payment ID, payment date, amount and reason. Do not include a card number, CVV, UPI PIN or OTP. We may request information needed to verify the transaction.'],
      ['Request window and review', 'Please raise a refund request within 7 calendar days of cancellation, payment discrepancy or the scheduled service date, as applicable. We aim to review requests within 2 business days of receiving the necessary information. This request window does not limit statutory rights or prevent review of a problem discovered later. Business days exclude weekends and public holidays.'],
      ['Refund method and timing', 'Approved refunds will be initiated within 5 business days of approval, using the original payment method for online transactions. Bank credit may take a further 5–7 business days after initiation, depending on the bank and payment method. These bank timelines are estimates, not guaranteed credit dates. Contact support with your payment reference if the refund is delayed. Offline payments are handled by the laboratory through an agreed, verified refund method.'],
      ['Failed payments', 'If payment appears unsuccessful but your account was debited, retain the transaction reference and contact support and your payment provider. An automatic reversal and a merchant-approved refund follow different processes.'],
    ],
  },
  {
    path: '/return-policy', title: 'Return Policy',
    summary: 'Returns for diagnostic services and laboratory reports.',
    sections: [
      ['Diagnostic services', 'Our website offers diagnostic services rather than retail goods. A completed test, biological sample or issued report cannot be returned as a purchased product.'],
      ['Concerns about a service or report', 'If you believe a report contains an error or a service was not delivered correctly, contact the laboratory with your booking reference. The team will review the concern and advise whether clarification, correction or recollection is appropriate. A corrected report does not automatically establish refund eligibility.'],
      ['Cancellations and refunds', 'For an unused or cancelled service, duplicate charge or other payment concern, refer to the Cancellation & Refund Policy. This policy does not limit rights under applicable law.'],
    ],
  },
  {
    path: '/shipping-and-delivery-policy', title: 'Service Delivery Policy',
    summary: 'Sample collection, report availability and delivery of diagnostic services.',
    sections: [
      ['Shipping', 'Diagnostic bookings do not involve shipment of retail products. Confirm any request for printed reports or other physical delivery directly with the laboratory, including availability and charges.'],
      ['Appointments and collection', 'Services are arranged for the selected appointment subject to laboratory confirmation. Follow the preparation instructions for your test. Confirm the location and any collection arrangements with the laboratory before your appointment.'],
      ['Report availability', 'Reports are released to the patient account after laboratory processing and pathologist approval. Sign in to view available reports. Payment confirmation is not a report delivery confirmation.'],
      ['Turnaround times and delays', 'Ask the laboratory for the expected turnaround time for each selected test before booking. Timelines run from receipt of a suitable sample, vary by test and may change if recollection, repeat testing or additional review is required. Contact support if your report is overdue. A payment receipt does not imply immediate delivery of a report.'],
    ],
  },
  {
    path: '/disclaimer', title: 'Medical & Website Disclaimer',
    summary: 'Understanding the purpose and limitations of this website and your test reports.',
    sections: [
      ['Medical interpretation', 'Website information is general information and does not replace a consultation, diagnosis or treatment from a qualified medical practitioner. A laboratory result should be interpreted alongside symptoms, medical history and other clinical findings.'],
      ['Emergency care', 'This website and its support channels are not emergency services. Seek immediate medical care in an emergency rather than waiting for an online response or test report.'],
      ['Results and availability', 'Results can be affected by preparation, timing, sample quality and other clinical factors. A test result alone does not guarantee a particular health outcome. Website availability and report timing can be affected by maintenance or service interruptions.'],
      ['Third-party services', 'Third-party payment and communication services have their own terms and privacy practices. References to Razorpay do not mean that online payments are enabled or that Razorpay has approved this website. This disclaimer does not exclude obligations or rights that cannot be excluded under applicable law.'],
    ],
  },
  {
    path: '/about-us', title: 'About Us',
    summary: 'Diagnostic services with online booking and access to approved reports.',
    sections: [
      ['About INDIPATH', 'INDIPATH Multidiagnostic LLP is the laboratory name displayed on this website, based in Kankavali, Maharashtra. The platform supports patient registration, test bookings and access to diagnostic reports.'],
      ['What you can do online', 'Register as a patient, view available tests and packages during booking, arrange an appointment and access reports once approved. Contact the laboratory for test preparation requirements, current prices and availability.'],
      ['Our workflow', 'Reception manages appointments and billing, technicians handle sample processing, and pathologists review reports before release. Please speak to your treating doctor about the tests appropriate for you.'],
    ],
  },
  {
    path: '/contact-us', title: 'Contact Us',
    summary: 'Get help with appointments, reports, payments and privacy requests.',
    sections: [
      ['Booking and payment support', 'For booking changes or payment concerns, include your booking reference and, where applicable, your transaction reference. Never share passwords, OTPs, card security codes or UPI PINs.'],
      ['Report and privacy queries', 'Contact the laboratory for report access, corrections or privacy requests. Identity verification may be required before patient information is discussed. Avoid sending full medical reports in an initial support email.'],
      ['Complaints and follow-up', 'Send complaints to the support email below with a brief description and booking reference. We aim to acknowledge requests within 2 business days. Complex clinical or transaction reviews may take longer; the team will explain any further information needed. Contact us to confirm visiting hours and directions before travelling to the laboratory.'],
    ],
  },
];
