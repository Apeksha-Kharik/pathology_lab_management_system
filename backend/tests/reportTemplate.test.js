const test = require('node:test');
const assert = require('node:assert/strict');
const { getTemplate, applyTemplate } = require('../services/reportTemplateService');

const booking = { testId: { reportTemplate: [
  { parameter: 'Hemoglobin', value: 'placeholder', unit: 'g/dL', referenceRange: '12-16' },
  { parameter: 'Platelets', unit: '/uL', referenceRange: '150000-450000' }
] } };

test('drafts retain entered values and use admin metadata', () => {
  const rows = applyTemplate(booking, [{ parameter: 'Hemoglobin', value: '0', unit: 'changed', normalRange: 'changed' }]);
  assert.equal(rows[0].value, '0');
  assert.equal(rows[0].unit, 'g/dL');
  assert.equal(rows[0].normalRange, '12-16');
});

test('submission requires every template result and ignores extra fields', () => {
  assert.throws(() => applyTemplate(booking, [{ parameter: 'Hemoglobin', value: '13' }], true), /Platelets/);
  const rows = applyTemplate(booking, [{ parameter: 'Platelets', value: '200000' }, { parameter: 'Hemoglobin', value: '13' }, { parameter: 'Extra', value: '1' }], true);
  assert.deepEqual(rows.map(row => row.parameter), ['Hemoglobin', 'Platelets']);
});

test('package template takes precedence, otherwise component formats are combined', () => {
  const item = { bookingType: 'Package', packageId: { reportTemplate: [{ parameter: 'Package result' }] }, packageTests: [{ testName: 'CBC', ...booking.testId }] };
  assert.equal(getTemplate(item)[0].parameter, 'Package result');
  item.packageId.reportTemplate = [];
  assert.equal(getTemplate(item)[0].parameter, 'CBC - Hemoglobin');
});
