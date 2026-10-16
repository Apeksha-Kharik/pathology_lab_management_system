const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const mongoose = require('mongoose');
const { getTemplate } = require('../services/reportTemplateService');

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 30000 });
  const db = mongoose.connection.db;
  const tests = await db.collection('tests').find({}).toArray();
  const packages = await db.collection('packages').find({}).toArray();
  const names = ['Complete Blood Count(CBC)', 'Blood Glucose / Blood Sugar', 'Lipid Profile', 'Liver Function Test (LFT)', 'Kidney/Renal Function Test (KFT/RFT)', 'Thyroid Function Test (T3, T4, TSH)', 'Urine Routine & Microscopy'];
  const members = names.map(name => tests.find(test => test.testName === name));
  if (members.some(test => !test?.reportTemplate?.length)) throw new Error('Missing starter test definition');
  const pkg = packages.find(item => item.packageName === 'full body checkup');
  if (!pkg) throw new Error('Package not found');
  if (!pkg.reportTemplate?.length) {
    const update = {
      includedTests: members.map(test => test._id),
      parametersCount: members.length,
      reportDescription: 'Starter full body checkup format combining CBC, glucose, lipid, liver, kidney, thyroid and urine tests. Review the laboratory parameter lists and reference intervals before use.',
      reportTemplate: members.flatMap(test => test.reportTemplate.map(row => ({
        parameter: `${test.testName} - ${row.parameter}`, value: '', unit: row.unit || '', referenceRange: row.referenceRange || ''
      })))
    };
    console.log(JSON.stringify({ package: pkg.packageName, tests: names, parameters: update.reportTemplate.length }));
    if (process.argv.includes('--apply')) {
      const backupDir = path.join(__dirname, '../../tmp/template-backups');
      fs.mkdirSync(backupDir, { recursive: true });
      fs.writeFileSync(path.join(backupDir, `full-body-${Date.now()}.json`), JSON.stringify(pkg, null, 2));
      const result = await db.collection('packages').updateOne({ _id: pkg._id, 'reportTemplate.0': { $exists: false } }, { $set: update });
      if (result.modifiedCount !== 1) throw new Error('Package changed during update');
      Object.assign(pkg, update);
    }
  }
  const bookings = await db.collection('bookings').find({}, { projection: { testName: 1, bookingType: 1, testId: 1, packageId: 1, packageTests: 1 } }).toArray();
  const testById = new Map(tests.map(test => [String(test._id), test]));
  const packageById = new Map(packages.map(item => [String(item._id), item]));
  const missing = [];
  const covered = new Set();
  for (const booking of bookings) {
    const resolved = { ...booking, testId: testById.get(String(booking.testId)), packageId: packageById.get(String(booking.packageId)), packageTests: (booking.packageTests || []).map(id => testById.get(String(id))).filter(Boolean) };
    if (!getTemplate(resolved).length) missing.push({ name: booking.testName, type: booking.bookingType });
    else covered.add(`${booking.bookingType || 'Test'}:${booking.testName}`);
  }
  const counts = {};
  for (const collection of ['tests', 'packages']) counts[collection] = await db.collection(collection).countDocuments({ 'reportTemplate.0': { $exists: true } });
  console.log(JSON.stringify({ bookingsChecked: bookings.length, coveredBookings: bookings.length - missing.length, distinctBookedItems: covered.size, missing, templateCounts: counts }));
  if (missing.length) throw new Error('Some bookings still lack a template');
}
main().catch(error => { console.error(error.name, error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
