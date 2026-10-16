export const receptionToday = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = type => parts.find(value => value.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
};

export const bookingStatus = booking => {
  const status = booking.bookingStatus || booking.status || 'Pending Approval';
  return status === 'Pending' ? 'Pending Approval' : status;
};
export const isPaymentDue = booking => ['Confirmed', 'Arrived'].includes(bookingStatus(booking)) && ['Unpaid', 'Failed'].includes(booking.paymentStatus);
export const canAssign = (booking, history = []) => ['Confirmed', 'Arrived'].includes(bookingStatus(booking)) && booking.paymentStatus === 'Paid' && !booking.assignedTechnician && !['Rejected', 'Cancelled', 'Processing', 'Pending Report Approval', 'Report Ready', 'Completed'].includes(bookingStatus(booking)) && !history.some(item => ['PENDING', 'ACCEPTED'].includes(item.status));

export const assignmentScope = (booking, history = []) => {
  if (booking.assignedTechnician || history.some(item => item.status === 'ACCEPTED')) return 'assigned';
  if (history.some(item => item.status === 'PENDING')) return 'pending';
  return canAssign(booking, history) ? 'ready' : 'other';
};

export const currentAssignment = (history = []) => {
  const newest = [...history].sort((a, b) => new Date(b.requestedAt || 0) - new Date(a.requestedAt || 0));
  return newest.find(item => item.status === 'ACCEPTED') || newest.find(item => item.status === 'PENDING') || newest[0];
};

// Keep every applicable desk action available, as in the original workflow.
export const bookingActions = (booking, history = [], view = 'all') => {
  if (bookingStatus(booking) === 'Pending Approval') return [{ type: 'confirm', label: 'Confirm booking' }];
  const actions = [];
  if (['Confirmed', 'Technician Assigned'].includes(bookingStatus(booking)) && !booking.patientArrived) actions.push({ type: 'arrival', label: 'Patient Arrived' });
  if (isPaymentDue(booking)) actions.push(booking.paymentPreference === 'online'
    ? { type: 'waiting', label: 'Awaiting online payment' }
    : { type: 'payment', label: 'Mark as Paid' });
  if (canAssign(booking, history)) actions.push({ type: 'assign', label: history.length ? 'Auto Reassign Fairly' : 'Auto Send Request' });
  if (history.some(item => item.status === 'PENDING')) actions.push({ type: 'waiting', label: 'Awaiting technician' });
  if (booking.paymentStatus === 'Paid') actions.push({ type: 'receipt', label: 'Generate Receipt' });
  return actions.filter(action => {
    if (view === 'all') return true;
    if (action.type === 'assign' || (action.type === 'waiting' && action.label === 'Awaiting technician')) return view === 'assignments';
    if (action.type === 'arrival') return view === 'appointments';
    return true;
  });
};

export const primaryAction = (booking, history = [], view = 'appointments') => {
  if (bookingStatus(booking) === 'Pending Approval') return { type: 'confirm', label: 'Confirm booking' };
  if (view === 'payments' && isPaymentDue(booking)) return booking.paymentPreference === 'online' ? { type: 'waiting', label: 'Awaiting online payment' } : { type: 'payment', label: 'Collect payment' };
  if (canAssign(booking, history)) return { type: 'assign', label: history.length ? 'Auto Reassign Fairly' : 'Auto Send Request' };
  if (['Confirmed', 'Technician Assigned'].includes(bookingStatus(booking)) && !booking.patientArrived) return { type: 'arrival', label: 'Mark arrived' };
  if (isPaymentDue(booking)) return booking.paymentPreference === 'online' ? { type: 'waiting', label: 'Awaiting online payment' } : { type: 'payment', label: 'Collect payment' };
  if (history.some(item => item.status === 'PENDING')) return { type: 'waiting', label: 'Awaiting technician' };
  if (view === 'assignments') return { type: 'details', label: 'View details' };
  if (booking.paymentStatus === 'Paid') return { type: 'receipt', label: 'View receipt' };
  return { type: 'details', label: 'View details' };
};

export const searchBookings = (bookings, search) => {
  const query = search.trim().toLowerCase();
  return bookings.filter(booking => !query || [booking.name, booking.bookingCode, booking.patientCode, booking.phone, booking.testName].some(value => String(value || '').toLowerCase().includes(query)));
};
