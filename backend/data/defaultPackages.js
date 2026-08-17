const defaultPackages = [
  {
    packageName: "Advanced Cardiac Risk Profile",
    category: "Heart Health",
    price: 1799,
    description: "Focused screening for cholesterol balance, inflammation markers, and cardiac risk monitoring.",
    parametersCount: 62,
    homeCollection: true,
    reportDescription: "Cardiac risk profile covering lipid markers, sugar status, inflammation, and essential organ function indicators.",
    reportTemplate: [
      { parameter: "Total Cholesterol", unit: "mg/dL", referenceRange: "< 200" },
      { parameter: "HDL Cholesterol", unit: "mg/dL", referenceRange: "> 40" },
      { parameter: "LDL Cholesterol", unit: "mg/dL", referenceRange: "< 100" },
      { parameter: "Triglycerides", unit: "mg/dL", referenceRange: "< 150" },
      { parameter: "hs-CRP", unit: "mg/L", referenceRange: "< 3.0" }
    ]
  },
  {
    packageName: "Women Hormone Wellness Panel",
    category: "Women Health",
    price: 2199,
    description: "A balanced wellness panel for thyroid, vitamin, anemia, and hormone-related health checks.",
    parametersCount: 74,
    homeCollection: true,
    reportDescription: "Women wellness panel with thyroid, vitamin, CBC, iron, and reproductive hormone screening markers.",
    reportTemplate: [
      { parameter: "TSH", unit: "uIU/mL", referenceRange: "0.4 - 4.0" },
      { parameter: "Vitamin D", unit: "ng/mL", referenceRange: "30 - 100" },
      { parameter: "Vitamin B12", unit: "pg/mL", referenceRange: "200 - 900" },
      { parameter: "Hemoglobin", unit: "g/dL", referenceRange: "12.0 - 15.5" },
      { parameter: "Ferritin", unit: "ng/mL", referenceRange: "13 - 150" }
    ]
  },
  {
    packageName: "Senior Preventive Care Plus",
    category: "Senior Care",
    price: 2399,
    description: "Comprehensive preventive screening for seniors covering sugar, kidney, liver, thyroid, and vitamins.",
    parametersCount: 98,
    homeCollection: true,
    reportDescription: "Senior preventive care profile for chronic health monitoring and routine wellness review.",
    reportTemplate: [
      { parameter: "Fasting Blood Sugar", unit: "mg/dL", referenceRange: "70 - 100" },
      { parameter: "HbA1c", unit: "%", referenceRange: "< 5.7" },
      { parameter: "Creatinine", unit: "mg/dL", referenceRange: "0.6 - 1.3" },
      { parameter: "SGPT", unit: "U/L", referenceRange: "7 - 56" },
      { parameter: "TSH", unit: "uIU/mL", referenceRange: "0.4 - 4.0" }
    ]
  },
  {
    packageName: "Fever Infection Complete Panel",
    category: "Fever Profile",
    price: 1299,
    description: "Useful for fever evaluation with CBC, infection markers, malaria, dengue, and inflammation checks.",
    parametersCount: 46,
    homeCollection: true,
    reportDescription: "Fever and infection panel designed to support early clinical review for common fever causes.",
    reportTemplate: [
      { parameter: "Total WBC Count", unit: "cells/cumm", referenceRange: "4000 - 11000" },
      { parameter: "Platelet Count", unit: "lakhs/cumm", referenceRange: "1.5 - 4.5" },
      { parameter: "CRP", unit: "mg/L", referenceRange: "< 5" },
      { parameter: "Dengue NS1", unit: "", referenceRange: "Negative" },
      { parameter: "Malaria Parasite", unit: "", referenceRange: "Not seen" }
    ]
  },
  {
    packageName: "Lifestyle Fitness Check",
    category: "Fitness",
    price: 1599,
    description: "A practical package for active adults tracking energy, muscle health, sugar, lipids, and vitamins.",
    parametersCount: 68,
    homeCollection: true,
    reportDescription: "Fitness profile covering metabolic, vitamin, liver, kidney, lipid, and muscle health indicators.",
    reportTemplate: [
      { parameter: "Creatine Kinase", unit: "U/L", referenceRange: "30 - 200" },
      { parameter: "Vitamin D", unit: "ng/mL", referenceRange: "30 - 100" },
      { parameter: "Calcium", unit: "mg/dL", referenceRange: "8.5 - 10.5" },
      { parameter: "Fasting Blood Sugar", unit: "mg/dL", referenceRange: "70 - 100" },
      { parameter: "Total Protein", unit: "g/dL", referenceRange: "6.0 - 8.3" }
    ]
  }
];

module.exports = defaultPackages;
