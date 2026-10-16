const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const mongoose = require('mongoose');
const { expandTest, categoryFor, key } = require('../data/expandedReportTemplates');
async function main() {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 30000 });
  const db = mongoose.connection.db;
  const tests = await db.collection('tests').find({}).toArray();
  const packages = await db.collection('packages').find({}).toArray();
  const originals = tests.map(item => ({ ...item }));
  const changes = [];
  for (const test of tests) {
    const rows = expandTest(test, originals);
    if (!rows.length) throw new Error(`Missing definition: ${test.testName}`);
    changes.push({ collection: 'tests', id: test._id, name: test.testName, before: test.reportTemplate || [], after: rows });
    test.reportTemplate = rows;
  }
  const byId = new Map(tests.map(test => [String(test._id), test]));
  for (const pkg of packages) {
    const members = (pkg.includedTests || []).map(id => byId.get(String(id))).filter(Boolean);
    const seen = new Set();
    const rows = members.length ? members.flatMap(test => {
      const group = categoryFor(test.testName) || key(test.testName);
      if (seen.has(group)) return [];
      seen.add(group);
      return test.reportTemplate.map(row => ({ ...row, parameter: `${test.testName} - ${row.parameter}` }));
    }) : (pkg.reportTemplate || []).map(row => ({ parameter: row.parameter, value: '', unit: row.unit || '', referenceRange: row.referenceRange || '' }));
    if (!rows.length) throw new Error(`Missing package members: ${pkg.packageName}`);
    changes.push({ collection: 'packages', id: pkg._id, name: pkg.packageName, before: pkg.reportTemplate || [], after: rows });
  }
  console.log(JSON.stringify(changes.map(item => ({ type: item.collection, name: item.name, before: item.before.length, after: item.after.length })), null, 2));
  if (process.argv.includes('--apply')) {
    const directory = path.join(__dirname, '../../tmp/template-backups');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, `all-templates-${Date.now()}.json`), JSON.stringify(changes, null, 2));
    for (const change of changes) {
      const result = await db.collection(change.collection).updateOne({ _id: change.id }, { $set: { reportTemplate: change.after } });
      if (!result.matchedCount) throw new Error('Template target disappeared');
      const saved = await db.collection(change.collection).findOne({ _id: change.id });
      if (JSON.stringify(saved.reportTemplate) !== JSON.stringify(change.after)) throw new Error('Saved template differs');
    }
    console.log(`Verified ${changes.length} templates; saved reports unchanged.`);
  }
}
main().catch(error => { console.error(error.name, error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
