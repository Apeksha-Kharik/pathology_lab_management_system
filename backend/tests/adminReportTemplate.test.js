const { test } = require('node:test');
const assert = require('node:assert/strict');
const Package = require('../models/Package');
const { updatePackageTemplate } = require('../controllers/reportTemplateController');
const invoke = async body => {
  const res = { code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
  await updatePackageTemplate({ params: { id: '507f1f77bcf86cd799439011' }, body }, res);
  return res;
};
test('legacy package template editing updates only template fields', async t => {
  let update;
  t.mock.method(Package, 'findByIdAndUpdate', async (id, payload) => { update = payload.$set; return { _id: id, ...update }; });
  const res = await invoke({ reportTemplate: [{ parameter: ' A ', value: 'example', unit: ' u ' }], price: 99, isActive: true, includedTests: [] });
  assert.equal(res.code, 200);
  assert.deepEqual(Object.keys(update).sort(), ['reportDescription', 'reportLetterhead', 'reportTemplate']);
  assert.deepEqual(update.reportTemplate, [{ parameter: 'A', value: '', unit: 'u', referenceRange: '' }]);
});
test('duplicate and blank parameters fail without a database write', async t => {
  t.mock.method(Package, 'findByIdAndUpdate', async () => { assert.fail('unexpected write'); });
  for (const rows of [[{ parameter: 'A' }, { parameter: ' a ' }], [{ parameter: ' ' }]]) assert.equal((await invoke({ reportTemplate: rows })).code, 400);
});
test('template can be removed without deleting a package', async t => {
  t.mock.method(Package, 'findByIdAndUpdate', async (id, payload) => ({ _id: id, ...payload.$set }));
  const res = await invoke({ reportTemplate: [] });
  assert.equal(res.code, 200);
  assert.deepEqual(res.data.item.reportTemplate, []);
});
