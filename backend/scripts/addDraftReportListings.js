const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const mongoose = require('mongoose');
const Test = require('../models/Test');
const Package = require('../models/Package');

// Catalog examples, not quoted local tariffs. Lab must review before activation.
const sources = [
  'https://www.1mg.com/labs/test/vitamin-d-25-hydroxy-1972',
  'https://www.1mg.com/labs/test/vitamin-d-25-hydroxy-vitamin-b12-32352',
  'https://www.1mg.com/labs/test/vitamin-d-b12-calcium-36788'
];
const draftTests = [
  { testName: 'Vitamin D (25-Hydroxy)', parameter: 'Vitamin D (25-Hydroxy)', unit: 'ng/mL', price: 900 },
  { testName: 'Vitamin B12', parameter: 'Vitamin B12', unit: 'pg/mL', price: 600 },
  { testName: 'Calcium (Total)', parameter: 'Total Calcium', unit: 'mg/dL', price: 250 }
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 30000 });
  const definitions = draftTests.map(item => ({
    testName: item.testName, category: 'Blood Tests', price: item.price,
    sampleType: 'Serum', isActive: false,
    description: `Draft listing. Provisional price INR ${item.price}; admin review required before activation.`,
    reportDescription: 'Lab review required: configure method-specific reference intervals before activation.',
    reportTemplate: [{ parameter: item.parameter, value: '', unit: item.unit, referenceRange: '' }]
  }));
  const apply = process.argv.includes('--apply');
  const saved = [];
  for (const item of definitions) {
    let record = await Test.findOne({ testName: item.testName });
    if (!record && apply) record = await Test.create(item);
    saved.push(record || item);
  }
  const panels = [
    { packageName: 'Vitamin D & B12 Panel', packageCode: 'DRAFT-VIT-DB12', count: 2 },
    { packageName: 'Vitamin D, B12 & Calcium Panel', packageCode: 'DRAFT-VIT-DB12CA', count: 3 }
  ];
  for (const panel of panels) {
    const members = saved.slice(0, panel.count);
    const item = {
      packageName: panel.packageName, packageCode: panel.packageCode,
      category: 'Vitamin & Mineral Tests', price: members.reduce((sum, test) => sum + test.price, 0),
      description: 'Draft package. Provisional price is the sum of component prices; admin review required before activation.',
      reportDescription: 'Lab review required: configure method-specific reference intervals before activation.',
      includedTests: members.map(test => test._id), parametersCount: panel.count,
      status: 'inactive', isActive: false, homeCollection: true,
      reportTemplate: members.flatMap(test => test.reportTemplate.map(row => ({ parameter: row.parameter, value: '', unit: row.unit, referenceRange: '' })))
    };
    if (apply && !await Package.exists({ $or: [{ packageName: item.packageName }, { packageCode: item.packageCode }] })) await Package.create(item);
    console.log(JSON.stringify({ package: item.packageName, price: item.price, active: false }));
  }
  console.log(JSON.stringify({ tests: definitions.map(t => ({ name: t.testName, price: t.price })), sources, applied: apply }));
  if (apply) {
    const tests = await Test.find({ testName: { $in: draftTests.map(t => t.testName) } }).lean();
    const packages = await Package.find({ packageCode: { $in: panels.map(p => p.packageCode) } }).lean();
    if (tests.length !== 3 || packages.length !== 2 || [...tests, ...packages].some(d => d.isActive !== false || !d.reportTemplate?.length)) throw new Error('Draft verification failed');
    console.log('Verified 3 inactive test listings and 2 inactive package listings with blank result fields.');
    for (const collection of ['tests', 'packages']) console.log(JSON.stringify({ collection, templateCount: await mongoose.connection.db.collection(collection).countDocuments({ 'reportTemplate.0': { $exists: true } }) }));
  }
}
main().catch(error => { console.error(error.name, 'Draft creation failed'); process.exitCode = 1; }).finally(() => mongoose.disconnect());
