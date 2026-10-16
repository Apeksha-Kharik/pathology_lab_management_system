// Starter fields. New reference intervals intentionally require the lab's review.
const row = (parameter, unit = '') => ({ parameter, unit, value: '', referenceRange: '' });
const groups = {
  cbc: [['Hemoglobin','g/dL'],['RBC Count','million/\u00b5L'],['WBC Count','cells/\u00b5L'],['Platelet Count','/\u00b5L'],['Hematocrit (PCV)','%'],['MCV','fL'],['MCH','pg'],['MCHC','g/dL'],['RDW-CV','%'],['MPV','fL']],
  liver: [['Total Bilirubin','mg/dL'],['Direct Bilirubin','mg/dL'],['Indirect Bilirubin','mg/dL'],['SGPT','U/L'],['SGOT (AST)','U/L'],['Alkaline Phosphatase (ALP)','U/L'],['GGT','U/L'],['Total Protein','g/dL'],['Albumin','g/dL'],['Globulin','g/dL'],['Albumin / Globulin Ratio','']],
  kidney: [['Blood Urea','mg/dL'],['Serum Creatinine','mg/dL'],['Uric Acid','mg/dL'],['Sodium','mmol/L'],['Potassium','mmol/L'],['Chloride','mmol/L']],
  lipid: [['Total Cholesterol','mg/dL'],['HDL Cholesterol','mg/dL'],['LDL Cholesterol','mg/dL'],['Triglycerides','mg/dL'],['VLDL Cholesterol','mg/dL'],['Non-HDL Cholesterol','mg/dL'],['Total Cholesterol / HDL Ratio','']],
  thyroid: [['T3','ng/dL'],['T4','\u00b5g/dL'],['TSH','\u00b5IU/mL']],
  urine: [['Colour',''],['Appearance',''],['Specific Gravity',''],['pH',''],['Protein',''],['Glucose',''],['Ketones',''],['Bilirubin',''],['Urobilinogen',''],['Blood',''],['Nitrite',''],['Leukocyte Esterase',''],['Pus Cells (WBC)','/HPF'],['Red Blood Cells','/HPF'],['Epithelial Cells','/HPF'],['Casts',''],['Crystals',''],['Bacteria','']],
  group: [['ABO Blood Group',''],['Rh Factor','']],
  widal: [['S. Typhi O (TO)','Titre'],['S. Typhi H (TH)','Titre'],['S. Paratyphi A (AH)','Titre'],['S. Paratyphi B (BH)','Titre']],
  protein: [['Total Urine Volume','mL/24 hr'],['24-hour Urine Protein','mg/24 hr']],
  culture: [['Culture Result',''],['Organism Isolated',''],['Colony Count','CFU/mL']]
};
const key = text => String(text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const categoryFor = name => /cbc|complete blood count/i.test(name) ? 'cbc' : /liver function/i.test(name) ? 'liver' : /kidney|renal function/i.test(name) ? 'kidney' : /lipid profile/i.test(name) ? 'lipid' : /thyroid function/i.test(name) ? 'thyroid' : /urine routine/i.test(name) ? 'urine' : /blood group/i.test(name) ? 'group' : /widal/i.test(name) ? 'widal' : /24.hour urine protein/i.test(name) ? 'protein' : /urine culture/i.test(name) ? 'culture' : null;
const expandTest = (test, allTests) => {
  const category = categoryFor(test.testName);
  const originals = test.reportTemplate || [];
  if (!category) return originals.map(item => ({ parameter: item.parameter, value: '', unit: item.unit || '', referenceRange: item.referenceRange || '' }));
  const peers = allTests.filter(item => categoryFor(item.testName) === category).flatMap(item => item.reportTemplate || []);
  return groups[category].map(([parameter, unit]) => {
    const original = [...originals, ...peers].find(item => key(item.parameter) === key(parameter) && (!unit || item.unit === unit));
    return { ...row(parameter, unit), referenceRange: original?.referenceRange || '' };
  });
};
module.exports = { expandTest, categoryFor, key };
