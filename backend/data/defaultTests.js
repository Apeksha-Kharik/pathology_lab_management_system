const bloodTest = (testName, price, description, options = {}) => ({
  testName,
  category: "Blood Tests",
  price,
  description,
  sampleType: options.sampleType || "Blood",
  turnaroundTime: options.turnaroundTime || "Same day",
  conditions: options.conditions || "No fasting required",
  isActive: true
});

const urineTest = (testName, price, description, options = {}) => ({
  testName,
  category: "Urine Tests",
  price,
  description,
  sampleType: options.sampleType || "Urine",
  turnaroundTime: options.turnaroundTime || "Same day",
  conditions: options.conditions || "Collect a clean-catch urine sample",
  isActive: true
});

const infectionTest = (testName, price, description, options = {}) => ({
  testName,
  category: "Infection Tests",
  price,
  description,
  sampleType: options.sampleType || "Blood",
  turnaroundTime: options.turnaroundTime || "Same day",
  conditions: options.conditions || "No fasting required",
  isActive: true
});

const defaultTests = [
  bloodTest("CBC — Complete Blood Count", 350, "Measures red cells, white cells, platelets, hemoglobin and related blood indices."),
  bloodTest("Hb — Hemoglobin", 150, "Measures the hemoglobin level to help screen for anemia and related conditions."),
  bloodTest("ESR — Erythrocyte Sedimentation Rate", 200, "Measures the rate of red-cell sedimentation as a nonspecific marker of inflammation."),
  bloodTest("Blood Group & Rh", 200, "Determines ABO blood group and Rh factor."),
  bloodTest("Blood Glucose / Blood Sugar", 120, "Measures blood glucose for diabetes screening and monitoring.", { conditions: "Fasting may be required depending on the requested glucose test" }),
  bloodTest("HbA1c", 500, "Shows the average blood glucose level over approximately the previous three months."),
  bloodTest("Lipid Profile", 700, "Measures cholesterol, triglycerides, HDL, LDL and related lipid values.", { conditions: "8–12 hours fasting preferred" }),
  bloodTest("Liver Function Test (LFT)", 750, "Measures liver enzymes, bilirubin and proteins to assess liver function."),
  bloodTest("Kidney/Renal Function Test (KFT/RFT)", 750, "Measures kidney-related markers such as creatinine, urea and electrolytes."),
  bloodTest("Thyroid Function Test (T3, T4, TSH)", 900, "Measures thyroid hormones and TSH to assess thyroid function.", { sampleType: "Serum" }),
  bloodTest("CRP — C-Reactive Protein", 600, "Measures C-reactive protein as a marker of inflammation.", { sampleType: "Serum" }),

  urineTest("Urine Routine & Microscopy", 250, "Physical, chemical and microscopic examination of urine."),
  urineTest("Urine Culture", 700, "Detects and identifies bacteria or fungi that may cause a urinary tract infection.", { turnaroundTime: "2–3 days", conditions: "Collect a sterile clean-catch midstream urine sample before antibiotics where possible" }),
  urineTest("Urine Pregnancy Test", 200, "Detects hCG in urine to screen for pregnancy.", { conditions: "First-morning urine is preferred" }),
  urineTest("24-hour Urine Protein", 450, "Measures the total amount of protein passed in urine over 24 hours.", { turnaroundTime: "1–2 days", conditions: "Collect all urine passed during the instructed 24-hour period" }),

  infectionTest("Dengue NS1 / IgM / IgG", 1200, "Tests for dengue NS1 antigen and IgM/IgG antibodies.", { sampleType: "Serum" }),
  infectionTest("Malaria Test", 400, "Screens blood for malaria parasites or malaria antigens."),
  infectionTest("Widal Test", 350, "Detects antibodies associated with Salmonella infection.", { sampleType: "Serum" }),
  infectionTest("Typhoid Test", 600, "Laboratory screening for evidence of typhoid infection.", { sampleType: "Blood/Serum" }),
  infectionTest("HIV Test", 600, "Screens for HIV infection using an approved laboratory method.", { sampleType: "Blood/Serum", conditions: "Pre-test consent and counselling may be required" }),
  infectionTest("HBsAg", 500, "Screens for hepatitis B surface antigen.", { sampleType: "Serum" }),
  infectionTest("HCV Test", 700, "Screens for antibodies or markers associated with hepatitis C infection.", { sampleType: "Serum" })
];

module.exports = defaultTests;
