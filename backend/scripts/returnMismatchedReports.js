const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const mongoose = require('mongoose');
const { getTemplate } = require('../services/reportTemplateService');
const normalize = value => {
  const name = String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return ({ haemoglobin: 'hemoglobin', hemoglobinhb: 'hemoglobin', hematocrithct: 'hematocritpcv', rdw: 'rdwcv' })[name] || name;
};
async function main() {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 30000 });
  const db = mongoose.connection.db;
  const map = items => new Map(items.map(item => [String(item._id), item]));
  const tests = map(await db.collection('tests').find({}).toArray());
  const packages = map(await db.collection('packages').find({}).toArray());
  const bookings = map(await db.collection('bookings').find({}, { projection: { testName: 1, testId: 1, packageId: 1, bookingType: 1, packageTests: 1, bookingStatus: 1, status: 1, testStarted: 1 } }).toArray());
  const reports = await db.collection('reports').find({ status: { $in: ['Approved', 'Pending Approval', 'Pending Review'] } }).toArray();
  const affected = [];
  for (const report of reports) {
    const booking = bookings.get(String(report.bookingId));
    if (!booking) continue;
    const template = getTemplate({ ...booking, testId: tests.get(String(booking.testId)), packageId: packages.get(String(booking.packageId)), packageTests: (booking.packageTests || []).map(id => tests.get(String(id))).filter(Boolean) });
    if (!template.length) continue;
    const names = new Set(template.map(row => normalize(row.parameter)));
    const unmatched = (report.results || []).filter(row => !names.has(normalize(row.parameter)));
    if (unmatched.length) affected.push({ report, booking, unmatched: unmatched.map(row => row.parameter) });
  }
  console.log(JSON.stringify({ candidates: affected.length, reports: affected.map(item => ({ id: String(item.report._id), test: item.report.testName, unmatched: item.unmatched })) }));
  if (process.argv.includes('--apply') && affected.length) {
    const directory = path.join(__dirname, '../../tmp/template-backups');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, `report-corrections-${Date.now()}.json`), JSON.stringify(affected, null, 2));
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const { report, booking, unmatched } of affected) {
          const update = await db.collection('reports').updateOne({ _id: report._id, status: report.status, results: report.results }, {
            $set: { status: 'Rejected', reportStatus: 'Rejected', finalStatus: 'Correction Needed', rejectionReason: `Saved parameters do not match the booked test template (${unmatched.join(', ')}). Verify original laboratory records, enter correct results using the current template, and resubmit for pathologist review.`, pathologistSignature: '', pathologistSignatureImage: '', approvedPathologistName: '', approvedPathologistQualification: '', approvedPathologistRegistrationNumber: '', authorizedPersonName: '', authorizedSignatureImage: '', authorizationStatus: 'Pending', updatedAt: new Date() },
            $unset: { approvedBy: '', approvedAt: '', authorizedBy: '', authorizedAt: '' }
          }, { session });
          if (update.modifiedCount !== 1) throw new Error('Report changed during correction');
          const result = await db.collection('bookings').updateOne({ _id: booking._id }, { $set: { bookingStatus: 'Processing', status: 'Processing', testStarted: true, updatedAt: new Date() } }, { session });
          if (result.matchedCount !== 1) throw new Error('Booking missing');
        }
      });
    } finally { await session.endSession(); }
    for (const { report } of affected) {
      const saved = await db.collection('reports').findOne({ _id: report._id });
      if (saved.status !== 'Rejected' || JSON.stringify(saved.results) !== JSON.stringify(report.results)) throw new Error('Correction verification failed');
    }
    console.log(`Verified ${affected.length} reports returned for correction; original result values preserved.`);
  }
}
main().catch(error => { console.error(error.name, error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
