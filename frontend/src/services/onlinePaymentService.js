import api from './api';

let checkoutScript;

export const loadRazorpay = () => {
  if (window.Razorpay) return Promise.resolve();
  if (checkoutScript) return checkoutScript;
  checkoutScript = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => fail(), 20000);
    const fail = () => {
      window.clearTimeout(timeout);
      script.remove();
      checkoutScript = undefined;
      reject(new Error('Unable to load secure checkout. Check your connection and try again.'));
    };
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      window.clearTimeout(timeout);
      if (window.Razorpay) resolve();
      else fail();
    };
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return checkoutScript;
};

export const payForBooking = async (booking) => {
  await loadRazorpay();
  const id = booking._id || booking.id;
  const { data: order } = await api.post(`/bookings/${id}/payment/order`, {}, { timeout: 60000 });
  if (order.paid) return order.booking;
  return new Promise((resolve, reject) => {
    let verifying = false;
    let finished = false;
    const checkout = new window.Razorpay({
      key: order.key,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: 'INDIPATH',
      description: 'Laboratory booking — Test Mode',
      prefill: {
        name: booking.name || booking.patientName,
        email: booking.email,
        contact: booking.phone || booking.mobile
      },
      theme: { color: '#047857' },
      retry: { enabled: false },
      modal: {
        ondismiss: () => {
          if (!verifying && !finished) {
            finished = true;
            reject(new Error('Checkout closed. Payment has not been confirmed. If debited, refresh your bookings before retrying.'));
          }
        }
      },
      handler: async (response) => {
        if (finished || verifying) return;
        verifying = true;
        try {
          const { data } = await api.post(`/bookings/${id}/payment/verify`, response, { timeout: 60000 });
          finished = true;
          resolve(data.booking);
        } catch (error) {
          finished = true;
          reject(new Error(error.response?.data?.message || 'Payment confirmation is pending. Do not pay again; refresh shortly or contact the laboratory.'));
        }
      }
    });
    checkout.on('payment.failed', () => {
      if (finished || verifying) return;
      finished = true;
      checkout.close();
      reject(new Error('Payment failed. No payment has been confirmed. If debited, check with the laboratory before retrying.'));
    });
    checkout.open();
  });
};
