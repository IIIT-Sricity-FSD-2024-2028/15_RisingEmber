import { expect, test } from '@playwright/test';

const localOrigins = new Set([
  'http://127.0.0.1:8080',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://localhost:3000',
]);

const criticalPages = [
  ['/Landing_Page/index.html', 'landing'],
  ['/customer/login.html', 'customer login'],
  ['/provider/login.html', 'provider login'],
  ['/arbitrator/arbitrator_login.html', 'arbitrator login'],
  ['/admin/admin_reports.html', 'admin reports'],
];

for (const [pathname, label] of criticalPages) {
  test(`${label} boots with external network blocked`, async ({ page }) => {
    const criticalFailures = [];

    await page.route('**/*', async (route) => {
      const url = route.request().url();
      if (/^https?:/i.test(url) && !localOrigins.has(new URL(url).origin)) {
        await route.abort();
        return;
      }
      await route.continue();
    });

    page.on('requestfailed', (request) => {
      if (['script', 'stylesheet', 'font'].includes(request.resourceType())) {
        criticalFailures.push(`${request.resourceType()} ${request.url()}: ${request.failure()?.errorText || 'failed'}`);
      }
    });
    page.on('response', (response) => {
      const resourceType = response.request().resourceType();
      if (['script', 'stylesheet', 'font'].includes(resourceType) && response.status() >= 400) {
        criticalFailures.push(`${resourceType} ${response.status()} ${response.url()}`);
      }
    });

    await page.goto(pathname, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts?.ready);
    await page.waitForTimeout(250);

    expect(criticalFailures, criticalFailures.join('\n')).toEqual([]);
  });
}
