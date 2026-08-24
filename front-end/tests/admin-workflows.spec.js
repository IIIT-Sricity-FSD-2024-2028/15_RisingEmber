import { expect, test } from '@playwright/test';
import { collectRuntimeFailures, expectNoRuntimeFailures } from './helpers/servicehub.js';

async function loginAdmin(page) {
  await page.goto('/admin/admin_landing.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#adminEmail').fill('admin@servicehub.test');
  await page.locator('#adminPass').fill('admin123');
  await page.locator('#adminLoginForm button[type="submit"]').click();
  await expect(page).toHaveURL(/\/admin\/admin_dashboard\.html/);
}

test('admin can inspect prepared records and keep user/settings changes API-backed', async ({ browser, request }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const failures = collectRuntimeFailures(page);
  const targetEmail = `evaluation-admin-target-${Date.now()}@servicehub.test`;

  try {
    const registration = await request.post('http://127.0.0.1:3000/api/v1/customers/register', {
      data: {
        name: 'Evaluation Target',
        email: targetEmail,
        password: 'customer123',
        phone: '9999999900',
        city: 'Mumbai',
        address: 'Evaluation address',
      },
    });
    expect(registration.status()).toBe(201);
    const targetUserId = (await registration.json()).data.actorId;
    expect(targetUserId).toMatch(/^user_/);

    await loginAdmin(page);

    await page.goto('/admin/admin_cases.html', { waitUntil: 'domcontentloaded' });
    const caseRow = page.locator('#case-table-body tr').filter({ hasText: 'case_8001' });
    await expect(caseRow).toHaveCount(1);
    await caseRow.locator('.case-id-link').click();
    await expect(page).toHaveURL(/admin_case_details\.html\?id=case_8001/);
    await expect(page.locator('#case-id-display')).toHaveText('case_8001');
    await expect(page.locator('#chat-container')).toContainText('machine started leaking');

    await page.goto('/admin/admin_documents.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#doc-table-body')).toContainText('leakage-photos.zip');
    await page.goto('/admin/admin_document_details.html?id=document_11001', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#doc-sub-header')).toContainText('document_11001');
    await expect(page.locator('#in-case')).toHaveValue('case_8001');

    await page.goto('/admin/admin_hearings.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#hearings-table-body')).toContainText('case_8001');
    await page.goto('/admin/admin_hearing_details.html?id=hearing_10001', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#h-id-title')).toContainText('hearing_10001');
    await expect(page.locator('#v-case')).toHaveText('case_8001');

    await page.goto('/admin/admin_awards.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#award-table-body')).toContainText('case_8001');
    await page.goto('/admin/admin_award_details.html?id=award_12001', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#sub-header')).toContainText('award_12001');
    await expect(page.locator('#in-case')).toHaveValue('case_8001');

    await page.goto('/admin/admin_users.html', { waitUntil: 'domcontentloaded' });
    await page.locator('#userSearch').fill(targetEmail);
    const targetRow = page.locator('#user-table-body tr').filter({ hasText: targetEmail });
    await expect(targetRow).toHaveCount(1);
    await expect(targetRow).toContainText('Active');

    const disableResponse = page.waitForResponse((response) => (
      response.url().endsWith(`/api/v1/users/${targetUserId}`) && response.request().method() === 'PATCH'
    ));
    await targetRow.locator('a.link-red').click();
    expect((await disableResponse).status()).toBe(200);
    await expect(targetRow).toContainText('Suspended');

    const enableResponse = page.waitForResponse((response) => (
      response.url().endsWith(`/api/v1/users/${targetUserId}`) && response.request().method() === 'PATCH'
    ));
    await targetRow.locator('a.link-red').click();
    expect((await enableResponse).status()).toBe(200);
    await expect(targetRow).toContainText('Active');

    await page.route(`**/api/v1/users/${targetUserId}`, async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'simulated admin update failure' }),
        });
        return;
      }
      await route.continue();
    });
    await targetRow.locator('a.link-red').click();
    await expect(targetRow).toContainText('Active');
    await page.unroute(`**/api/v1/users/${targetUserId}`);

    await page.goto('/admin/admin_settings.html', { waitUntil: 'domcontentloaded' });
    const originalPhone = await page.locator('#g-phone').inputValue();
    await page.locator('#g-phone').fill('1800-EVAL-ADMIN');
    const settingsResponse = page.waitForResponse((response) => (
      response.url().endsWith('/api/v1/settings') && response.request().method() === 'PATCH'
    ));
    await page.getByRole('button', { name: /Save Settings/i }).click();
    expect((await settingsResponse).status()).toBe(200);
    await expect(page.locator('.admin-app-toast--success')).toContainText('backend successfully');

    await page.locator('#g-phone').fill(originalPhone);
    const restoreSettingsResponse = page.waitForResponse((response) => (
      response.url().endsWith('/api/v1/settings') && response.request().method() === 'PATCH'
    ));
    await page.getByRole('button', { name: /Save Settings/i }).click();
    expect((await restoreSettingsResponse).status()).toBe(200);

    await page.route('**/api/v1/settings', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'simulated settings update failure' }),
        });
        return;
      }
      await route.continue();
    });
    await page.locator('#g-phone').fill('DO-NOT-PERSIST');
    await page.getByRole('button', { name: /Save Settings/i }).click();
    await page.waitForTimeout(150);
    await expect(page.locator('.admin-app-toast--error')).toContainText('simulated settings update failure');
    await page.unroute('**/api/v1/settings');

    const backendSettings = await page.evaluate(() => window.requestAdminApi('/settings', {
      headers: window.getAdminRequestHeaders(),
    }));
    expect(backendSettings.general.phone).toBe(originalPhone);
    expectNoRuntimeFailures(failures.filter((failure) => (
      !failure.includes('/api/v1/users/')
      && !failure.includes('/api/v1/settings')
      && !failure.includes('503 (Service Unavailable)')
    )));
  } finally {
    await context.close();
  }
});
