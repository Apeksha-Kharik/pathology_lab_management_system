const { test } = require('node:test');
const assert = require('node:assert/strict');
const { expandTest, key } = require('../data/expandedReportTemplates');
test('multi-parameter tests expand with unique names and blank results', () => {
  for (const [testName, minimum] of [['Complete Blood Count(CBC)', 10], ['Liver Function Test (LFT)', 10], ['Kidney/Renal Function Test', 6], ['Lipid Profile', 7], ['Thyroid Function Test (TFT)', 3], ['Urine Routine & Microscopy', 18], ['Blood Group & Rh', 2], ['Widal Test', 4], ['24-hour Urine Protein', 2]]) {
    const rows = expandTest({ testName, reportTemplate: [] }, []);
    assert.ok(rows.length >= minimum, testName);
    assert.equal(new Set(rows.map(row => key(row.parameter))).size, rows.length);
    assert.ok(rows.every(row => row.value === ''));
  }
});
test('wrong unit cannot import an incompatible reference range', () => {
  const item = { testName: 'Complete Blood Count (CBC)', reportTemplate: [{ parameter: 'Hemoglobin', unit: 'ml', referenceRange: '12-13' }] };
  const rows = expandTest(item, [item]);
  assert.equal(rows[0].unit, 'g/dL');
  assert.equal(rows[0].referenceRange, '');
});
test('single analyte tests retain one field without fabricated results', () => {
  const item = { testName: 'HbA1c', reportTemplate: [{ parameter: 'HbA1c', unit: '%', value: 'example', referenceRange: '<5.7' }] };
  const rows = expandTest(item, [item]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].value, '');
  assert.equal(rows[0].referenceRange, '<5.7');
});
