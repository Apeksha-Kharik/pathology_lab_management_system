const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const scenarios = [
  { role: 'patient', url: '/patient_dashboard', sections: ['Book Tests', 'Booking History', 'Reports & Receipts'] },
  { role: 'admin', url: '/admin', sections: ['Available Tests', 'Add New Test', 'Report Templates', 'Health Packages', 'Dashboard'] },
  { role: 'technician', url: '/technician/dashboard', sections: ['Assignment Requests', 'Sample Queue', 'Result Entry', 'Corrections', 'Submitted Reports'] },
  { role: 'pathologist', url: '/pathologist/dashboard', sections: ['Pending Review', 'Approved Reports', 'Corrections', 'Digital Signature', 'Monthly Report'] }
];

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const scenario of scenarios) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      await context.addInitScript(role => {
        localStorage.setItem('token', 'ui-test-only');
        localStorage.setItem('user', JSON.stringify({ id: 'demo-user', role, name: 'Example User', email: 'example@example.test' }));
      }, scenario.role);
      const page = await context.newPage();
      const errors = [];
      const alerts = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('dialog', async dialog => { alerts.push(dialog.message()); await dialog.dismiss(); });
      await page.route('http://localhost:5000/**', async route => {
        const request = route.request();
        const endpoint = new URL(request.url()).pathname;
        const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
        if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
        assert.equal(request.method(), 'GET', `Unexpected write: ${endpoint}`);
        let body = [];
        if (endpoint.endsWith('/profile')) body = { name: 'Example User', role: scenario.role, qualification: 'MD', registrationNumber: 'TEST123' };
        if (endpoint.endsWith('/dashboard-metrics')) body = {};
        if (endpoint.endsWith('/monthly')) body = { summary: { total: 0, approved: 0, pending: 0, rejected: 0 }, tests: [], reports: [] };
        await route.fulfill({ headers, contentType: 'application/json', body: JSON.stringify(body) });
      });
      await page.goto(`http://127.0.0.1:5197${scenario.url}`);
      for (const label of scenario.sections) {
        const button = page.getByRole('button', { name: new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first();
        await button.click();
        await page.waitForLoadState('networkidle');
        assert.deepEqual(errors, [], `${scenario.role}: ${label}`);
      }
      assert.deepEqual(alerts, [], `${scenario.role} alerts`);
      console.log(`${scenario.role}: ${scenario.sections.length} dashboard sections passed without runtime errors`);
      await context.close();
    }
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5197/receptionist/dashboard');
    await page.waitForURL('**/login');
    console.log('Unauthenticated dashboard access redirects to login');
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
