const numeric = value => {
  const text = String(value ?? '').trim().replace(/,/g, '');
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) ? Number(text) : null;
};
const rangeFor = (range, gender) => {
  const text = String(range || '').replace(/[\u2013\u2014]/g, '-').trim();
  if (/\b(?:male|female)\s*:/i.test(text)) {
    if (!/^(male|female)$/i.test(gender || '')) return '';
    const match = text.match(new RegExp(`\\b${gender}\\s*:\\s*(.*?)(?=\\b(?:male|female)\\s*:|$)`, 'i'));
    return match ? match[1].replace(/[\s/;]+$/, '').trim() : '';
  }
  return text;
};
const resultStatus = (row, gender) => {
  if (['Critical', 'Abnormal', 'Low', 'High'].includes(row.status)) return row.status;
  const value = numeric(row.value);
  if (value === null) return row.status || 'Not Set';
  const range = rangeFor(row.normalRange || row.referenceRange, gender).replace(/,/g, '');
  const interval = range.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
  if (interval) return value < Number(interval[1]) ? 'Low' : value > Number(interval[2]) ? 'High' : 'Normal';
  const limit = range.match(/^(<=|>=|<|>|\u2264|\u2265)\s*(\d+(?:\.\d+)?)$/);
  if (limit) {
    const bound = Number(limit[2]);
    const upper = ['<', '<=', '\u2264'].includes(limit[1]);
    const inclusive = ['<=', '>=', '\u2264', '\u2265'].includes(limit[1]);
    const outside = upper ? (inclusive ? value > bound : value >= bound) : (inclusive ? value < bound : value <= bound);
    return outside ? (upper ? 'High' : 'Low') : 'Normal';
  }
  return row.status || 'Not Set';
};
const reviewResults = (results = [], gender) => {
  const rows = results.map(item => {
    const row = item.toObject ? item.toObject() : item;
    return { ...row, status: resultStatus(row, gender) };
  });
  const warnings = [];
  const groups = new Map();
  for (const row of rows) {
    const split = row.parameter.lastIndexOf(' - ');
    const group = split < 0 ? 'Results' : row.parameter.slice(0, split);
    const name = (split < 0 ? row.parameter : row.parameter.slice(split + 3)).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!groups.has(group)) groups.set(group, new Map());
    groups.get(group).set(name, row);
  }
  for (const [group, fields] of groups) {
    const find = names => names.map(name => fields.get(name)).find(Boolean);
    const rbc = find(['rbccount']);
    const hb = find(['hemoglobin', 'haemoglobin', 'hemoglobinhb']);
    const hct = find(['hematocritpcv', 'hematocrithct', 'hematocrit']);
    const rbcValue = numeric(rbc?.value);
    const hbValue = numeric(hb?.value);
    const hctValue = numeric(hct?.value);
    const conventionalRbc = /^(million\/(?:\u00b5|\u03bc|u)L|10\^12\/L)$/i.test(rbc?.unit || '');
    const check = (name, expected, unit) => {
      const row = fields.get(name.toLowerCase());
      const actual = numeric(row?.value);
      // A broad data-entry consistency check, not a clinical plausibility limit.
      if (row?.unit === unit && actual !== null && expected > 0 && Math.abs(actual - expected) / expected > 0.1) warnings.push(`${group}: verify ${name} against analyzer data; entered ${actual} ${unit}, calculated approximately ${expected.toFixed(1)} ${unit} from the other CBC results.`);
    };
    if (conventionalRbc && rbcValue > 0 && hct?.unit === '%' && hctValue > 0) check('MCV', hctValue * 10 / rbcValue, 'fL');
    if (conventionalRbc && rbcValue > 0 && hb?.unit === 'g/dL' && hbValue > 0) check('MCH', hbValue * 10 / rbcValue, 'pg');
    if (hb?.unit === 'g/dL' && hct?.unit === '%' && hbValue > 0 && hctValue > 0) check('MCHC', hbValue * 100 / hctValue, 'g/dL');
  }
  const missing = rows.filter(row => !(row.normalRange || row.referenceRange || '').trim());
  if (missing.length) warnings.push(`Reference intervals are not configured for ${missing.map(row => row.parameter).join(', ')}. Laboratory review required; no interval has been assumed.`);
  return { rows, warnings };
};
module.exports = { numeric, rangeFor, resultStatus, reviewResults };
