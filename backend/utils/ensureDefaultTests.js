const Test = require("../models/Test");
const defaultTests = require("../data/defaultTests");

const ensureDefaultTests = async () => {
  const existingTests = await Test.find({
    testName: { $in: defaultTests.map((test) => test.testName) }
  }).select("testName");
  const existingNames = new Set(existingTests.map((test) => test.testName));
  const missingTests = defaultTests.filter((test) => !existingNames.has(test.testName));

  if (!missingTests.length) {
    return;
  }

  await Test.insertMany(missingTests);
  console.log(`Added ${missingTests.length} default laboratory test(s)`);
};

module.exports = ensureDefaultTests;
