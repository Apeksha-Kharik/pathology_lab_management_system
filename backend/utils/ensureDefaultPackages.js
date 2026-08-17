const Package = require("../models/Package");
const defaultPackages = require("../data/defaultPackages");

const ensureDefaultPackages = async () => {
  const names = defaultPackages.map((item) => item.packageName);
  const existingPackages = await Package.find({ packageName: { $in: names } }).select("packageName");
  const existingNames = new Set(existingPackages.map((item) => item.packageName));
  const missingPackages = defaultPackages.filter((item) => !existingNames.has(item.packageName));

  if (!missingPackages.length) {
    return;
  }

  await Package.insertMany(missingPackages);
  console.log(`Added ${missingPackages.length} default health package(s)`);
};

module.exports = ensureDefaultPackages;
