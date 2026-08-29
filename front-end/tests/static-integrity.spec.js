import { expect, test } from '@playwright/test';
import { collectRuntimeFailures, expectNoRuntimeFailures } from './helpers/servicehub.js';

const entryPages = [
  ['landing', '/Landing_Page/index.html'],
  ['customer login', '/customer/login.html'],
  ['provider login', '/provider/login.html'],
  ['arbitrator login', '/arbitrator/arbitrator_login.html'],
  ['admin login', '/admin/admin_landing.html'],
];

for (const [name, path] of entryPages) {
  test(`${name} boots without runtime failures`, async ({ page }) => {
    const failures = collectRuntimeFailures(page);

    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    await page.waitForTimeout(250);

    expectNoRuntimeFailures(failures);
  });
}
