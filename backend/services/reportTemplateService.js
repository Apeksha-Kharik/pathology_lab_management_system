const getTemplate = (booking) => {
  if (booking.packageId?.reportTemplate?.length) return booking.packageId.reportTemplate;
  if (booking.bookingType === "Package" && booking.packageTests?.length) {
    return booking.packageTests.flatMap(test => (test.reportTemplate?.length ? test.reportTemplate : [{ parameter: "Result" }])
      .map(row => ({ parameter: `${test.testName} - ${row.parameter}`, unit: row.unit || "", referenceRange: row.referenceRange || "" })));
  }
  return booking.testId?.reportTemplate || [];
};

const applyTemplate = (booking, results, requireComplete = false) => {
  const template = getTemplate(booking);
  if (!template.length) return results;
  const key = value => String(value || "").trim().toLowerCase();
  const supplied = new Map(results.map(row => [key(row.parameter), row]));
  const missing = template.filter(row => !supplied.get(key(row.parameter))?.value?.trim());
  if (requireComplete && missing.length) {
    const error = new Error(`Enter results for all required parameters: ${missing.map(row => row.parameter).join(", ")}`);
    error.status = 400;
    throw error;
  }
  return template.flatMap(row => {
    const result = supplied.get(key(row.parameter));
    return result ? [{ ...result, parameter: row.parameter, unit: row.unit || "", referenceRange: row.referenceRange || "", normalRange: row.referenceRange || "" }] : [];
  });
};

module.exports = { getTemplate, applyTemplate };
