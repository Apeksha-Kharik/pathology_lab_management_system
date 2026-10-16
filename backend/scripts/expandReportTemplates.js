// Preview by default; pass --apply to save. Reuses existing lab definitions only.
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const mongoose = require('mongoose');

const key = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const clean = row => ({ parameter: row.parameter, value: '', unit: row.unit || '', referenceRange: row.referenceRange || '' });

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 30000 });
  const db = mongoose.connection.db;
  const tests = await db.collection('tests').find({}).toArray();
  const packages = await db.collection('packages').find({}).toArray();
  const changes = [];
  const append = (collection, item, rows) => {
    const existing = item.reportTemplate || [];
    const names = new Set(existing.map(row => key(row.parameter)));
    const additions = rows.map(clean).filter(row => {
      if (names.has(key(row.parameter))) return false;
      names.add(key(row.parameter));
      return true;
    });
    if (!additions.length) return;
    const updated = [...existing, ...additions];
    changes.push({ collection, id: item._id, name: item.testName || item.packageName, before: existing, after: updated });
    item.reportTemplate = updated;
  };
  const canonicalCBC = tests.find(t => t.testName === 'Complete Blood Count (CBC)');
  const hemoglobin = tests.find(t => t.testName === 'Hb — Hemoglobin')?.reportTemplate?.[0];
  const cbcRows = [hemoglobin && { ...hemoglobin, parameter: 'Hemoglobin' }, ...(canonicalCBC?.reportTemplate || []).filter(r => key(r.parameter) !== 'hemoglobin')].filter(Boolean);
  for (const test of tests) {
    if (/cbc|complete blood count/i.test(test.testName)) append('tests', test, cbcRows);
    if (test.testName === 'Lipid Profile') {
      append('tests', test, packages.find(p => p.packageName === 'Advanced Cardiac Risk Profile')?.reportTemplate?.filter(r => !/crp/i.test(r.parameter)) || []);
    }
    if (test.testName === 'Liver Function Test (LFT)') {
      append('tests', test, packages.find(p => p.packageName === 'Senior Preventive Care Plus')?.reportTemplate?.filter(r => r.parameter === 'SGPT') || []);
    }
  }
  const byId = new Map(tests.map(t => [String(t._id), t]));
  for (const pkg of packages) {
    if (pkg.reportTemplate?.length || !pkg.includedTests?.length) continue;
    const rows = pkg.includedTests.flatMap(id => {
      const test = byId.get(String(id));
      return (test?.reportTemplate || []).map(row => ({ ...clean(row), parameter: `${test.testName} - ${row.parameter}` }));
    });
    append('packages', pkg, rows);
  }
  console.log(JSON.stringify(changes.map(c => ({ collection: c.collection, name: c.name, before: c.before.length, after: c.after.length })), null, 2));
  if (process.argv.includes('--apply') && changes.length) {
    const backupDir = path.join(__dirname, '../../tmp/template-backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const backup = path.join(backupDir, `${Date.now()}.json`);
    fs.writeFileSync(backup, JSON.stringify(changes, null, 2));
    for (const change of changes) {
      const result = await db.collection(change.collection).updateOne(
        { _id: change.id, reportTemplate: change.before },
        { $set: { reportTemplate: change.after } }
      );
      if (result.modifiedCount !== 1) throw new Error(`Template changed during update: ${change.name}`);
      const saved = await db.collection(change.collection).findOne({ _id: change.id });
      if (JSON.stringify(saved.reportTemplate) !== JSON.stringify(change.after)) throw new Error(`Verification failed: ${change.name}`);
    }
    console.log(`Verified ${changes.length} updated templates. Backup: ${backup}`);
  }
}
main().catch(error => { console.error(error.name, 'Template expansion failed'); process.exitCode = 1; }).finally(() => mongoose.disconnect());
