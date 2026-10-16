const mongoose = require('mongoose');
const Test = require('../models/Test');
const Package = require('../models/Package');

const updateReportTemplate = Model => async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid template target ID' });
  const rows = req.body.reportTemplate;
  if (!Array.isArray(rows)) return res.status(400).json({ message: 'Template parameters must be an array' });
  const reportTemplate = rows.map(row => ({ parameter: String(row?.parameter || '').trim(), value: '', unit: String(row?.unit || '').trim(), referenceRange: String(row?.referenceRange || '').trim() }));
  const names = reportTemplate.map(row => row.parameter.toLowerCase());
  if (names.some(name => !name) || new Set(names).size !== names.length) return res.status(400).json({ message: 'Parameter names must be filled and unique' });
  try {
    const item = await Model.findByIdAndUpdate(req.params.id, { $set: {
      reportTemplate,
      reportLetterhead: String(req.body.reportLetterhead || '').trim(),
      reportDescription: String(req.body.reportDescription || '').trim()
    } }, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Test or package not found' });
    return res.json({ message: 'Report template saved successfully', item });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to save report template' });
  }
};

module.exports = { updateTestTemplate: updateReportTemplate(Test), updatePackageTemplate: updateReportTemplate(Package) };
