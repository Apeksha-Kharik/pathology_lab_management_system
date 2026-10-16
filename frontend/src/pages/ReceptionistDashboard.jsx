import "../styles/receptionDesk.css";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ClipboardList, CreditCard, Download, Eye, History, LogOut, Plus, RefreshCw, Search, UserCheck, X } from "lucide-react";
import { useAuth } from "../context/useAuth";
import logo from "../assets/logo.png";
import { createWalkInBooking, assignTechnician, downloadReceptionistReceipt, getReceptionistBookings, getReceptionistTests, getTechnicianAssignments, markPaymentPaid, updateBookingStatus } from "../services/receptionistService";
import { bookingActions, currentAssignment, bookingStatus, canAssign, isPaymentDue, receptionToday, searchBookings } from "../utils/receptionDesk";

const receptionistFont = "Aptos, Inter, 'Segoe UI', system-ui, sans-serif";
const money = value => `INR ${Number(value || 0).toLocaleString('en-IN')}`;
const displayDate = value => value ? new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not scheduled';
const getPatientIdText = booking => booking.patientCode || (bookingStatus(booking) === 'Pending Approval' ? 'Issued after confirmation' : bookingStatus(booking) === 'Rejected' ? 'Not issued' : 'Pending');
const formatAssignmentDate = value => value ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'Not recorded';
const fileName = booking => `${String(booking.name || 'patient').replace(/[^a-z0-9-_]+/gi, '-')}-${booking.patientCode || 'pending'}-RCT.pdf`;
const tabs = [
  { id: 'requests', label: 'Booking requests', icon: ClipboardList },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'assignments', label: 'Technician assignments', icon: UserCheck },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'history', label: 'Patient history', icon: History }
];
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50';
const primaryClass = 'inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

function ReceptionistDashboard() {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [tests, setTests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [activeView, setActiveView] = useState('requests');
  const [appointmentScope, setAppointmentScope] = useState('today');
  const [paymentScope, setPaymentScope] = useState('due');
  const [historySort, setHistorySort] = useState('newest');
  const [selectedId, setSelectedId] = useState(null);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [busyId, setBusyId] = useState('');
  const requestVersion = useRef(0);
  const actionInFlight = useRef(false);
  const today = receptionToday();
  const closeDetails = useCallback(() => setSelectedId(null), []);
  const invalidateRequests = useCallback(() => { requestVersion.current++; }, []);

  const loadData = useCallback(async ({ quiet = false } = {}) => {
    const version = ++requestVersion.current;
    if (!quiet) setRefreshing(true);
    try {
      const [bookingData, testData, assignmentData] = await Promise.all([getReceptionistBookings(), getReceptionistTests(), getTechnicianAssignments()]);
      if (version !== requestVersion.current) return;
      setBookings(bookingData || []);
      setTests(testData || []);
      setAssignments(assignmentData || []);
      if (!quiet) setNotice(null);
    } catch (error) {
      if (version === requestVersion.current) setNotice({ type: 'error', text: error.response?.data?.message || 'Unable to refresh bookings. Please try again.' });
    } finally {
      if (version === requestVersion.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useEffect(() => {
    loadData();
    const refresh = () => { if (!actionInFlight.current) loadData({ quiet: true }); };
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    return () => { invalidateRequests(); window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [loadData, invalidateRequests]);

  const assignmentsByBooking = useMemo(() => {
    const grouped = new Map();
    assignments.forEach(assignment => {
      const id = String(assignment.booking?._id || assignment.booking);
      grouped.set(id, [...(grouped.get(id) || []), assignment]);
    });
    return grouped;
  }, [assignments]);
  const pending = bookings.filter(booking => bookingStatus(booking) === 'Pending Approval');
  const scheduled = bookings.filter(booking => (booking.bookingDate || booking.date) === today && !['Rejected', 'Cancelled'].includes(bookingStatus(booking)));
  const paymentDue = bookings.filter(isPaymentDue);
  const assignmentBookings = bookings.filter(booking => !['Rejected', 'Cancelled', 'Completed', 'Report Ready'].includes(bookingStatus(booking)) && (canAssign(booking, assignmentsByBooking.get(booking._id)) || assignmentsByBooking.has(booking._id) || booking.assignedTechnician));
  const selectedBooking = bookings.find(booking => booking._id === selectedId);
  const pools = { requests: pending, appointments: bookings.filter(booking => !['Rejected', 'Cancelled'].includes(bookingStatus(booking))), assignments: assignmentBookings, payments: bookings.filter(booking => isPaymentDue(booking) || booking.paymentStatus === 'Paid'), history: bookings };
  let visible = searchBookings(pools[activeView], search);
  if (activeView === 'appointments' && appointmentScope !== 'all') visible = visible.filter(booking => appointmentScope === 'today' ? (booking.bookingDate || booking.date) === today : (booking.bookingDate || booking.date) > today);
  if (activeView === 'payments' && paymentScope !== 'all') visible = visible.filter(booking => paymentScope === 'due' ? isPaymentDue(booking) : booking.paymentStatus === 'Paid');
  visible = [...visible].sort((a, b) => {
    const direction = activeView === 'history' && historySort === 'newest' ? -1 : 1;
    return String(a.bookingDate || a.date || '').localeCompare(String(b.bookingDate || b.date || '')) * direction;
  });
  const counts = { requests: pending.length, appointments: scheduled.length, assignments: assignmentBookings.length, payments: paymentDue.length, history: bookings.length };
  const descriptions = { requests: 'Confirm new requests or open the details to review and reject a booking.', appointments: 'Mark patients arrived here. Send technician requests separately in Technician assignments.', assignments: 'Send technician requests after payment is paid; arrival is recorded separately. Track technician acceptance or rejection. After rejection, use Auto Reassign Fairly to request another available technician. Updates refresh every 15 seconds.', payments: 'Collect offline payments and access receipts for paid bookings.', history: 'Find previous visits, contact details, and payment receipts.' };

  const replaceBooking = booking => { if (booking?._id) setBookings(current => current.map(item => item._id === booking._id ? { ...item, ...booking } : item)); };
  const handleStatus = async (id, status) => {
    if (actionInFlight.current) return;
    let rejectionReason = '';
    let appointment = {};
    const booking = bookings.find(item => item._id === id);
    if (status === 'Confirmed' && booking && (!booking.timeSlot || !booking.bookingDate)) {
      const bookingDate = window.prompt('This older booking has incomplete appointment details. Enter the appointment date (YYYY-MM-DD).', receptionToday());
      if (bookingDate === null) return;
      const timeSlot = window.prompt('Enter the appointment time slot agreed with the patient.');
      if (timeSlot === null) return;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate.trim()) || !timeSlot.trim()) {
        setNotice({ type: 'error', text: 'Enter a valid appointment date and time slot. The booking has not been changed.' });
        return;
      }
      appointment = { bookingDate: bookingDate.trim(), timeSlot: timeSlot.trim() };
    }
    if (status === 'Rejected') {
      const reason = window.prompt('Reason for rejecting this booking');
      if (reason === null) return;
      if (!reason.trim()) { setNotice({ type: 'error', text: 'Enter a rejection reason. The booking has not been changed.' }); return; }
      rejectionReason = reason.trim();
    }
    actionInFlight.current = true;
    requestVersion.current++;
    setBusyId(id);
    try {
      const data = await updateBookingStatus(id, status, rejectionReason, appointment);
      replaceBooking(data.booking);
      setNotice({ type: 'success', text: data.message });
    } catch (error) {
      if (error.response?.status === 409) await loadData({ quiet: true });
      setNotice({ type: 'error', text: error.response?.data?.message || 'Booking update failed.' });
    }
    finally { actionInFlight.current = false; setBusyId(''); setLoading(false); setRefreshing(false); }
  };
  const handleReceipt = async (booking, download = false) => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setBusyId(booking._id);
    try {
      const blob = await downloadReceptionistReceipt(booking._id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      if (download) link.download = fileName(booking);
      else { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { setNotice({ type: 'error', text: 'Unable to open the receipt. Please try again.' }); }
    finally { actionInFlight.current = false; setBusyId(''); }
  };
  const handleAssign = async booking => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    requestVersion.current++;
    setBusyId(booking._id);
    try {
      const data = await assignTechnician(booking._id);
      if (data.assignment) setAssignments(current => [data.assignment, ...current.filter(item => item._id !== data.assignment._id)]);
      setNotice({ type: 'success', text: data.message });
    } catch (error) { setNotice({ type: 'error', text: error.response?.data?.message || 'Technician assignment failed.' }); }
    finally { actionInFlight.current = false; setBusyId(''); setLoading(false); setRefreshing(false); }
  };
  const handleAction = (booking, action) => {
    if (action.type === 'confirm') handleStatus(booking._id, 'Confirmed');
    else if (action.type === 'arrival') handleStatus(booking._id, 'Arrived');
    else if (action.type === 'payment') { setSelectedId(null); setPaymentBooking(booking); }
    else if (action.type === 'assign') handleAssign(booking);
    else if (action.type === 'receipt') handleReceipt(booking);
    else setSelectedId(booking._id);
  };
  const summary = [
    { view: 'requests', label: 'Booking requests', value: pending.length, caption: 'Waiting for confirmation', icon: ClipboardList },
    { view: 'appointments', label: "Today's appointments", value: scheduled.length, caption: displayDate(today), icon: CalendarDays },
    { view: 'payments', label: 'Payments due', value: paymentDue.length, caption: `${money(paymentDue.reduce((sum, booking) => sum + Number(booking.amount || 0), 0))} outstanding`, icon: CreditCard }
  ];

  return <div className="reception-dashboard min-h-screen bg-slate-50 text-slate-900" style={{ fontFamily: receptionistFont }}>
    <aside className="desk-sidebar">
      <div className="desk-sidebar-brand"><span className="desk-brand-mark"><img src={logo} alt="" /></span><div><p>INDIPATH</p><span>Laboratory management</span></div></div>
      <div className="desk-sidebar-caption">RECEPTION WORKSPACE</div>
      <nav role="tablist" aria-label="Reception tasks" className="desk-sidebar-nav">{tabs.map(({ id, label, icon }) => <button key={id} id={`desktop-tab-${id}`} type="button" role="tab" aria-selected={activeView === id} aria-controls="reception-task-panel" onClick={() => setActiveView(id)}>{React.createElement(icon, { size: 18 })}<span>{label}</span><small>{counts[id]}</small></button>)}</nav>
      <div className="desk-sidebar-footer"><span className="desk-footer-mark">+</span><div><strong>Patient care starts here.</strong><p>Super Speciality Pathology Lab</p></div></div>
    </aside>
    <header className="desk-topbar border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="desk-topbar-brand flex items-center gap-3"><img src={logo} alt="INDIPATH" className="h-10 w-10 object-contain" /><div><p className="font-bold tracking-tight text-emerald-950">INDIPATH</p><p className="text-xs text-slate-500">Reception desk</p></div></div>
        <div className="desk-breadcrumb"><span>Workspace</span><span>/</span><strong>Reception</strong></div>
        <div className="flex items-center gap-3 sm:gap-5"><span className="desk-date"><CalendarDays size={15} />{displayDate(today)}</span><div className="desk-account"><span className="desk-avatar">{String(user?.name || 'R').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}</span><div><p>{user?.name || 'Receptionist'}</p><span>Receptionist</span></div></div><button aria-label="Log out" type="button" onClick={() => { logout(); window.location.href = '/login'; }} className={buttonClass}><LogOut size={16} /><span className="hidden sm:inline">Log out</span></button></div>
      </div>
    </header>
    <main className="desk-shell mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="desk-page-heading flex flex-wrap items-center justify-between gap-4"><div><p className="desk-eyebrow">PATIENT SERVICES</p><h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Reception overview</h1><p className="mt-1 text-sm text-slate-500">Manage patient visits, payments, and technician handoffs.</p></div><button type="button" onClick={() => setShowWalkIn(true)} className={primaryClass}><Plus size={17} />Add walk-in patient</button></div>
      <div className="desk-stats grid gap-4 sm:grid-cols-3">{summary.map(({ view, label, value, caption, icon }) => <button key={view} type="button" onClick={() => { setActiveView(view); setSearch(''); if (view === 'appointments') setAppointmentScope('today'); if (view === 'payments') setPaymentScope('due'); }} className={`desk-stat desk-stat-${view} rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600`}><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-600">{label}</span><span className="desk-stat-icon">{React.createElement(icon, { size: 21 })}</span></div><p className="desk-stat-value mt-3 text-3xl font-bold tracking-tight">{loading ? '-' : value}</p><p className="desk-stat-caption mt-1 text-xs text-slate-500">{caption}</p></button>)}</div>
      {notice && <div role={notice.type === 'error' ? 'alert' : 'status'} className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${notice.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}><span>{notice.text}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice(null)}><X size={17} /></button></div>}
      <section className="desk-workspace overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="desk-mobile-nav flex gap-1 overflow-x-auto border-b border-slate-200 px-3" role="tablist" aria-label="Reception tasks">{tabs.map(({ id, label, icon }) => <button key={id} type="button" role="tab" aria-selected={activeView === id} aria-controls="reception-task-panel" id={`tab-${id}`} onClick={() => setActiveView(id)} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600 ${activeView === id ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>{React.createElement(icon, { size: 16 })}{label}<span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{counts[id]}</span></button>)}</div>
        <div id="reception-task-panel" role="tabpanel" aria-label={tabs.find(tab => tab.id === activeView).label} className="desk-task-panel p-4 sm:p-5">
          <div className="desk-table-heading mb-5 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-lg font-bold">{tabs.find(tab => tab.id === activeView).label}</h2><p className="mt-1 text-sm text-slate-500">{descriptions[activeView]}</p></div><button type="button" disabled={refreshing || Boolean(busyId)} onClick={() => loadData()} className={buttonClass}><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />{refreshing ? 'Refreshing' : 'Refresh'}</button></div>
          <div className="desk-toolbar mb-4 flex flex-wrap items-center gap-3"><label className="flex min-w-0 flex-1 basis-64 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-emerald-600"><Search size={17} className="shrink-0 text-slate-400" /><input aria-label="Search bookings" placeholder="Search patient, booking, phone, or test" value={search} onChange={event => setSearch(event.target.value)} className="min-w-0 flex-1 text-sm outline-none" />{search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')}><X size={15} /></button>}</label>
            {activeView === 'appointments' && <select aria-label="Appointment period" value={appointmentScope} onChange={event => setAppointmentScope(event.target.value)} className={buttonClass}><option value="today">Today</option><option value="upcoming">Upcoming</option><option value="all">All dates</option></select>}
            {activeView === 'payments' && <select aria-label="Payment filter" value={paymentScope} onChange={event => setPaymentScope(event.target.value)} className={buttonClass}><option value="due">Payment due</option><option value="paid">Paid / receipts</option><option value="all">All payments</option></select>}
            {activeView === 'history' && <select aria-label="Sort history by date" value={historySort} onChange={event => setHistorySort(event.target.value)} className={buttonClass}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>}
            <span className="text-xs text-slate-500">{visible.length} booking{visible.length === 1 ? '' : 's'}</span>
          </div>
          {loading ? <div role="status" className="py-16 text-center text-sm text-slate-500">Loading bookings...</div> : visible.length ? <div className="desk-table-wrap overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Patient', 'Test / package', 'Appointment', 'Status', activeView === 'assignments' ? 'Technician' : 'Payment', 'Actions'].map(heading => <th scope="col" key={heading} className="px-4 py-3 font-semibold last:text-right">{heading}</th>)}</tr></thead><tbody>{visible.map(booking => {
            const history = assignmentsByBooking.get(booking._id) || [];
            const current = currentAssignment(history);
            const actions = bookingActions(booking, history, activeView);
            return <tr key={booking._id} className="border-t border-slate-100 align-top hover:bg-slate-50/70"><td className="px-4 py-4"><div className="desk-patient"><span aria-hidden="true" className="desk-patient-avatar">{String(booking.name || 'P').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}</span><div><button type="button" onClick={() => setSelectedId(booking._id)} className="text-left font-semibold text-slate-900 hover:text-emerald-800 hover:underline">{booking.name || 'Patient'}</button><p className="mt-1 text-xs text-slate-500">{booking.bookingCode || '-'}</p></div></div></td><td className="max-w-56 px-4 py-4 leading-5 text-slate-700">{booking.testName}</td><td className="whitespace-nowrap px-4 py-4 text-slate-700">{displayDate(booking.bookingDate || booking.date)}<p className="mt-1 text-xs text-slate-500">{booking.timeSlot || 'Appointment time missing'}</p></td><td className="px-4 py-4"><StatusBadge value={bookingStatus(booking)} /></td><td className="px-4 py-4">{activeView === 'assignments' ? <><p className="mb-1 font-medium text-slate-700">{booking.assignedTechnician?.name || current?.technician?.name || (booking.assignedTechnician ? 'Assigned technician' : 'Not assigned')}</p>{current ? <><AssignmentStatus status={current.status} />{current.respondedAt && <p className="mt-2 text-xs text-slate-500">Responded {formatAssignmentDate(current.respondedAt)}</p>}{current.status === 'REJECTED' && <p className="mt-2 max-w-64 break-words text-xs text-red-700">{current.rejectionReason || 'No reason provided.'} You can send another technician request.</p>}</> : <span className="text-xs text-slate-500">{booking.assignedTechnician ? 'Assigned' : 'Ready to assign'}</span>}</> : <><p className="mb-1 font-semibold">{money(booking.amount)}</p><StatusBadge value={booking.paymentStatus || 'Unpaid'} /></>}</td><td className="px-4 py-4"><div className="flex flex-col items-end gap-2">{activeView !== 'history' && actions.map(action => (action.type === 'waiting' ? <span key={action.type} className="max-w-40 text-right text-xs text-slate-500">{action.label}</span> : <button key={action.type} type="button" disabled={Boolean(busyId)} onClick={() => handleAction(booking, action)} className={`${primaryClass} whitespace-nowrap text-xs`}>{busyId === booking._id ? 'Please wait...' : action.label}</button>))}<button type="button" onClick={() => setSelectedId(booking._id)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-800"><Eye size={14} />Details</button></div></td></tr>;
          })}</tbody></table></div> : <div className="rounded-lg border border-dashed border-slate-200 px-6 py-14 text-center"><p className="font-semibold text-slate-700">{search ? 'No matching bookings' : 'No bookings in this view'}</p><p className="mt-2 text-sm text-slate-500">{search ? 'Try another name, booking ID, phone number, or test.' : 'New items will appear here as bookings progress.'}</p></div>}
        </div>
      </section>
    </main>
    {selectedBooking && <BookingDrawer view={activeView} booking={selectedBooking} history={assignmentsByBooking.get(selectedId) || []} busy={Boolean(busyId)} onClose={closeDetails} onAction={action => handleAction(selectedBooking, action)} onReject={() => handleStatus(selectedId, 'Rejected')} onReceipt={download => handleReceipt(selectedBooking, download)} />}
    {showWalkIn && <WalkInModal tests={tests} onClose={() => setShowWalkIn(false)} onCreated={() => { setShowWalkIn(false); loadData(); }} />}
    {paymentBooking && <PaymentModal booking={paymentBooking} onClose={() => setPaymentBooking(null)} onPaid={updated => { setPaymentBooking(null); replaceBooking(updated); setNotice({ type: 'success', text: 'Payment recorded. Receipt is available in booking details.' }); }} />}
  </div>;
}

function BookingDrawer({ view, booking, history, busy, onClose, onAction, onReject, onReceipt }) {
  const panel = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const keydown = event => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const controls = [...panel.current.querySelectorAll('button:not([disabled]), a[href], summary, input, select, textarea')].filter(element => element.getClientRects().length);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); previous?.focus?.(); };
  }, [onClose]);
  const action = bookingActions(booking, history, view).find(item => !['receipt', 'payment'].includes(item.type)) || { type: 'details' };
  const fields = [['Patient ID', getPatientIdText(booking)], ['Age / gender', [booking.age, booking.gender].filter(value => value !== undefined && value !== null && value !== '').join(' / ')], ['Phone', booking.phone], ['Email', booking.email], ['Appointment', `${displayDate(booking.bookingDate || booking.date)} | ${booking.timeSlot || 'Appointment time missing'}`], ['Collection', booking.collectionType || 'Visit Lab'], ['Sample', booking.sampleType], ['Address', booking.address], ['Prescribed by', booking.prescribedBy || booking.doctorNotes], ['Notes', booking.notes]];
  return <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/35" onClick={onClose}><aside ref={panel} role="dialog" aria-modal="true" aria-labelledby="booking-details-title" onClick={event => event.stopPropagation()} className="desk-drawer flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5"><div><p className="text-xs font-medium text-slate-500">{booking.bookingCode}</p><h2 id="booking-details-title" className="mt-1 text-xl font-bold">{booking.name}</h2><p className="mt-1 text-sm text-slate-600">{booking.testName}</p></div><button autoFocus type="button" aria-label="Close booking details" onClick={onClose} className={buttonClass}><X size={18} /></button></div>
    <div className="flex-1 space-y-6 overflow-y-auto p-5"><div className="flex flex-wrap gap-2"><StatusBadge value={bookingStatus(booking)} /><StatusBadge value={booking.paymentStatus || 'Unpaid'} /></div><dl className="space-y-4">{fields.filter(([, value]) => value !== undefined && value !== null && value !== '').map(([label, value]) => <div key={label} className="grid grid-cols-[105px_1fr] gap-4 text-sm"><dt className="text-slate-500">{label}</dt><dd className="break-words font-medium text-slate-800">{value}</dd></div>)}</dl>
      <section className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between"><h3 className="font-semibold">Payment</h3><span className="font-bold">{money(booking.amount)}</span></div><p className="mt-2 text-sm text-slate-500">{booking.paymentPreference === 'online' ? 'Patient pays online from Booking History.' : 'Payment collected at the desk or sample visit.'}</p>{isPaymentDue(booking) && booking.paymentPreference !== 'online' && <button type="button" disabled={busy} onClick={() => onAction({ type: 'payment' })} className={`${primaryClass} mt-3`}><CreditCard size={15} />Collect payment</button>}{booking.paymentStatus === 'Paid' && <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => onReceipt(false)} className={buttonClass}><Eye size={15} />View receipt</button><button type="button" disabled={busy} onClick={() => onReceipt(true)} className={buttonClass}><Download size={15} />Download</button></div>}</section>
      {history.length > 0 && <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold">Technician assignment history ({history.length})</summary><ol className="mt-4 space-y-4">{history.map(item => <li key={item._id} className="border-l-2 border-slate-200 pl-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{item.technician?.name || 'Technician'}</span><AssignmentStatus status={item.status} /></div><p className="mt-1 text-xs text-slate-500">Requested {formatAssignmentDate(item.requestedAt)}</p>{item.respondedAt && <p className="mt-1 text-xs text-slate-500">Responded {formatAssignmentDate(item.respondedAt)}</p>}{item.rejectionReason && <p className="mt-2 text-sm text-slate-600">{item.rejectionReason}</p>}</li>)}</ol></details>}
      {booking.rejectionReason && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800"><strong>Rejection reason:</strong> {booking.rejectionReason}</div>}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white p-5">{bookingStatus(booking) === 'Pending Approval' ? <button type="button" disabled={busy} onClick={onReject} className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Reject booking</button> : <span className="text-xs text-slate-500">Booking details</span>}{!['details', 'receipt'].includes(action.type) && <button type="button" disabled={busy || action.type === 'waiting'} onClick={() => onAction(action)} className={primaryClass}>{busy ? 'Please wait...' : action.label}</button>}</div>
  </aside></div>;
}

function AssignmentStatus({ status }) {
  return <StatusBadge value={({ PENDING: 'Awaiting response', ACCEPTED: 'Accepted', REJECTED: 'Rejected' })[status] || status} />;
}

function WalkInModal({ tests, onClose, onCreated }) {
  const [submitting, setSubmitting] = useState(false);
  const submitInFlight = useRef(false);
  const [collectionType, setCollectionType] = useState("Visit Lab");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    age: "",
    gender: "",
    prescribedBy: "",
    testId: "",
    bookingDate: receptionToday(),
    timeSlot: "Walk-in",
    notes: "",
    houseNo: "",
    building: "",
    street: "",
    landmark: "",
    area: "",
    city: "",
    taluka: "",
    district: "",
    state: "",
    pinCode: ""
  });

  const submit = async (e) => {
    e.preventDefault();
    if (submitInFlight.current) return;

    if (!form.name || !form.phone || !form.email || !form.age || !form.gender || !form.testId || !form.bookingDate || !form.timeSlot) {
      alert("Patient name, phone, email, age, gender, test, date and time are required");
      return;
    }

    if (collectionType === "Home Collection") {
      const requiredAddressFields = ["houseNo", "street", "area", "city", "taluka", "district", "state", "pinCode"];
      const missingAddress = requiredAddressFields.some((field) => !String(form[field] || "").trim());

      if (missingAddress) {
        alert("Please complete the home collection address.");
        return;
      }
    }

    const address = collectionType === "Home Collection"
      ? `${form.houseNo}, ${form.building ? `${form.building}, ` : ""}${form.street}, ${form.landmark ? `${form.landmark}, ` : ""}${form.area}, ${form.city}, ${form.taluka}, ${form.district}, ${form.state} - ${form.pinCode}`
      : "";

    submitInFlight.current = true;
    setSubmitting(true);
    try {
      const data = await createWalkInBooking({
        ...form,
        collectionType,
        homeSample: collectionType === "Home Collection",
        address
      });
      alert(data.message);
      onCreated();
    } catch (error) {
      alert(error.response?.data?.message || "Walk-in booking failed");
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Add Walk-In Patient" onClose={onClose}>
      <form onSubmit={submit} aria-busy={submitting} className="space-y-3">
        <Input placeholder="Patient name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input type="number" min="0" max="130" placeholder="Age" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100">
            <option value="">Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>
        <Input placeholder="Prescribed by / Doctor" value={form.prescribedBy} onChange={(e) => setForm({ ...form, prescribedBy: e.target.value })} />
        <select value={form.testId} onChange={(e) => setForm({ ...form, testId: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100">
          <option value="">Select test</option>
          {tests.map((test) => <option key={test._id} value={test._id}>{test.testName} - INR {test.price}</option>)}
        </select>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input type="date" aria-label="Booking date" value={form.bookingDate} onChange={(e) => setForm({ ...form, bookingDate: e.target.value })} />
          <Input placeholder="Time slot" value={form.timeSlot} onChange={(e) => setForm({ ...form, timeSlot: e.target.value })} />
        </div>
        <select value={collectionType} onChange={(e) => setCollectionType(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100">
          <option value="Visit Lab">Lab Visit</option>
          <option value="Home Collection">Home Visit</option>
        </select>
        {collectionType === "Home Collection" && (
          <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 sm:grid-cols-2">
            <Input placeholder="House / Flat No." value={form.houseNo} onChange={(e) => setForm({ ...form, houseNo: e.target.value })} />
            <Input placeholder="Building" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} />
            <Input placeholder="Street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
            <Input placeholder="Landmark" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
            <Input placeholder="Area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
            <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input placeholder="Taluka" value={form.taluka} onChange={(e) => setForm({ ...form, taluka: e.target.value })} />
            <Input placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            <Input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <Input placeholder="PIN Code" value={form.pinCode} onChange={(e) => setForm({ ...form, pinCode: e.target.value })} />
          </div>
        )}
        <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" />
        <button disabled={submitting} className="disabled:opacity-50 w-full rounded-2xl bg-emerald-700 p-3.5 font-black text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-800">{submitting ? 'Creating booking...' : 'Create Confirmed Booking'}</button>
      </form>
    </Modal>
  );
}

function PaymentModal({ booking, onClose, onPaid }) {
  const [submitting, setSubmitting] = useState(false);
  const submitInFlight = useRef(false);
  const [form, setForm] = useState({
    amount: booking.amount || "",
    paymentMethod: "cash"
  });

  const submit = async (e) => {
    e.preventDefault();
    if (submitInFlight.current) return;

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Enter a valid amount");
      return;
    }

    submitInFlight.current = true;
    setSubmitting(true);
    try {
      const data = await markPaymentPaid(booking._id, {
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod
      });
      alert(data.message);
      onPaid(data.booking);
    } catch (error) {
      alert(error.response?.data?.message || "Payment update failed");
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Mark Payment Paid - ${booking.bookingCode}`} onClose={onClose}>
      <form onSubmit={submit} aria-busy={submitting} className="space-y-3">
        <Input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100">
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
        </select>
        <button disabled={submitting} className="disabled:opacity-50 w-full rounded-2xl bg-emerald-700 p-3.5 font-black text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-800">{submitting ? 'Saving payment...' : 'Save Payment'}</button>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="desk-modal fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/35 p-4 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-emerald-100 bg-white p-5 shadow-2xl shadow-emerald-950/15 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight text-emerald-950">{title}</h2>
          <button onClick={onClose} className="rounded-xl px-3 py-2 text-sm font-black text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-800">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ value }) {
  const classes = ['Paid', 'Confirmed', 'Arrived', 'Accepted', 'Report Ready', 'Completed'].includes(value)
    ? 'bg-emerald-50 text-emerald-800 ring-emerald-100'
    : ['Rejected', 'Declined', 'Cancelled', 'Failed'].includes(value)
      ? 'bg-red-50 text-red-700 ring-red-100'
      : ['Pending Approval', 'Unpaid', 'Awaiting response'].includes(value)
        ? 'bg-amber-50 text-amber-800 ring-amber-100'
        : 'bg-slate-100 text-slate-600 ring-slate-200';
  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${classes}`}>{value || 'Pending'}</span>;
}

function Input(props) {
  return <input aria-label={props.placeholder} {...props} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" />;
}

export default ReceptionistDashboard;
