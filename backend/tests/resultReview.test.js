const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resultStatus, reviewResults } = require('../services/resultReviewService');
test('flags use the correct gender interval and do not confuse male with female', () => {
  const row = { value: '11', referenceRange: 'Male: 13-17 / Female: 12-15' };
  assert.equal(resultStatus(row, 'Female'), 'Low');
  assert.equal(resultStatus({ ...row, value: '12.5' }, 'Female'), 'Normal');
  assert.equal(resultStatus({ ...row, value: '12.5' }, 'Male'), 'Low');
  assert.equal(resultStatus(row, ''), 'Not Set');
});
test('uninterpretable ranges never fabricate a normal flag or critical threshold', () => {
  assert.equal(resultStatus({ value: '324', referenceRange: '' }), 'Not Set');
  assert.equal(resultStatus({ value: 'Positive', referenceRange: 'Negative' }), 'Not Set');
  assert.equal(resultStatus({ value: '150', referenceRange: '<140' }), 'High');
  assert.equal(resultStatus({ value: '200', referenceRange: '0-100', status: 'Critical' }), 'Critical');
});
test('CBC inconsistencies flag review and never change entered values', () => {
  const rows = [
    { parameter: 'CBC - RBC Count', value: '3.3', unit: 'million/\u00b5L' },
    { parameter: 'CBC - Hemoglobin', value: '11', unit: 'g/dL' },
    { parameter: 'CBC - Hematocrit (PCV)', value: '45', unit: '%' },
    { parameter: 'CBC - MCV', value: '324', unit: 'fL' },
    { parameter: 'CBC - MCH', value: '241', unit: 'pg' }
  ];
  const review = reviewResults(rows, 'Female');
  assert.ok(review.warnings.some(text => /MCV.*136.4/.test(text)));
  assert.ok(review.warnings.some(text => /MCH.*33.3/.test(text)));
  assert.equal(review.rows[3].value, '324');
  assert.ok(review.warnings.some(text => /Reference intervals/.test(text)));
  const wrongUnits = rows.map(row => row.parameter.endsWith('RBC Count') ? { ...row, unit: 'cells/L' } : row);
  assert.ok(!reviewResults(wrongUnits).warnings.some(text => /verify MCV/.test(text)));
});
test('CBC groups cannot borrow measurements from another panel', () => {
  const review = reviewResults([{ parameter: 'Panel A - RBC Count', value: '3.3', unit: 'million/uL' }, { parameter: 'Panel B - Hematocrit (PCV)', value: '45', unit: '%' }, { parameter: 'Panel B - MCV', value: '324', unit: 'fL' }]);
  assert.ok(!review.warnings.some(text => /verify MCV/.test(text)));
});
