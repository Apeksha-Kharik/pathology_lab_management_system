import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { payForBooking } from '../services/onlinePaymentService';
import { canPayOnline, paymentPreferenceLabel } from '../utils/paymentEligibility';

export default function BookingPayment({ booking, onPaid }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const paymentInProgress = useRef(false);
  const eligible = canPayOnline(booking);

  const pay = async () => {
    if (paymentInProgress.current) return;
    paymentInProgress.current = true;
    setBusy(true);
    setMessage('');
    try {
      const updated = await payForBooking(booking);
      onPaid?.(updated);
      setMessage('Test payment successful. Your receipt is available in Downloads.');
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Unable to start payment. Please try again.');
    } finally {
      paymentInProgress.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="min-w-36 space-y-2">
      {eligible ? (
        <>
          <button type="button" onClick={pay} disabled={busy} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
            {busy ? 'Processing…' : 'Pay Now'}
          </button>
          <p className="text-xs font-semibold text-amber-800">Test Mode · No real charge</p>
          <p className="max-w-52 text-xs text-slate-500">Review our <Link to="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="underline">terms</Link>, <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline">privacy</Link> and <Link to="/refund-policy" target="_blank" rel="noopener noreferrer" className="underline">refund policy</Link> before paying.</p>
        </>
      ) : (
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${booking.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          {booking.paymentStatus || 'Unpaid'}
        </span>
      )}
      <p className="text-xs text-slate-500">{paymentPreferenceLabel(booking.paymentPreference)}</p>
      {booking.paymentStatus === 'Paid' && booking.razorpayMode === 'test' && <p className="text-xs font-semibold text-amber-800">Test payment · No real money received</p>}
      {booking.paymentPreference === 'online' && (booking.bookingStatus || booking.status) === 'Pending Approval' && <p className="max-w-48 text-xs text-slate-500">Pay Now appears after receptionist confirmation.</p>}
      {message && <p role="status" className="max-w-64 text-sm text-slate-700">{message}</p>}
    </div>
  );
}
