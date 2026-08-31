import { expect, test } from '@playwright/test';
import { collectRuntimeFailures, expectNoRuntimeFailures } from './helpers/servicehub.js';

test('customer login uses the backend session and persists the returned actor', async ({ page }) => {
  const failures = collectRuntimeFailures(page);
  await page.goto('/customer/login.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#loginIdentifier').fill('aarav@gmail.com');
  await page.locator('#loginPassword').fill('123456Ab@');
  await page.locator('#customerLoginForm button[type="submit"]').click();

  await expect(page).toHaveURL(/\/customer\/customer_dashboard\.html/);
  const session = await page.evaluate(() => JSON.parse(localStorage.getItem('serviceHub_customer_session')));
  expect(session).toEqual(expect.objectContaining({ id: 'user_2001', role: 'customer', isLoggedIn: true }));
  expectNoRuntimeFailures(failures);
});

test('customer login rejects invalid backend credentials', async ({ page }) => {
  const failures = collectRuntimeFailures(page);
  await page.goto('/customer/login.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#loginIdentifier').fill('aarav@gmail.com');
  await page.locator('#loginPassword').fill('wrong-password');
  await page.locator('#customerLoginForm button[type="submit"]').click();

  await expect(page.locator('#loginMessage')).toContainText(/invalid|password|backend/i);
  await expect(page).toHaveURL(/\/customer\/login\.html/);
  expectNoRuntimeFailures(failures.filter((failure) => !failure.includes('/session/login') && !failure.includes('401 (Unauthorized)')));
});

test('provider login uses the backend session and persists the returned actor', async ({ page }) => {
  const failures = collectRuntimeFailures(page);
  await page.goto('/provider/login.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#loginEmail').fill('rohan@gmail.com');
  await page.locator('#loginPassword').fill('123456Ab@');
  await page.locator('#loginForm button[type="submit"]').click();

  await expect(page).toHaveURL(/\/provider\/provider_dashboard\.html/);
  const activeUser = await page.evaluate(() => JSON.parse(localStorage.getItem('activeUser')));
  expect(activeUser).toEqual(expect.objectContaining({ id: 'user_3001', role: 'provider', isLoggedIn: true }));
  expectNoRuntimeFailures(failures);
});

test('provider login rejects invalid backend credentials', async ({ page }) => {
  const failures = collectRuntimeFailures(page);
  await page.goto('/provider/login.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#loginEmail').fill('rohan@gmail.com');
  await page.locator('#loginPassword').fill('wrong-password');
  await page.locator('#loginForm button[type="submit"]').click();

  await expect(page.locator('#inlineMessage')).toContainText(/invalid|password|backend/i);
  await expect(page).toHaveURL(/\/provider\/login\.html/);
  expectNoRuntimeFailures(failures.filter((failure) => !failure.includes('/session/login') && !failure.includes('401 (Unauthorized)')));
});

test('arbitrator login uses the backend session', async ({ page }) => {
  const failures = collectRuntimeFailures(page);
  await page.goto('/arbitrator/arbitrator_login.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#loginEmail').fill('kabir@gmail.com');
  await page.locator('#loginPassword').fill('123456Ab@');
  await page.locator('#loginForm button[type="submit"]').click();

  await expect(page).toHaveURL(/\/arbitrator\/arbitrator_dashboard\.html/);
  const activeUser = await page.evaluate(() => JSON.parse(localStorage.getItem('activeUser')));
  expect(activeUser).toEqual(expect.objectContaining({ id: 'user_4001', role: 'arbitrator', isLoggedIn: true }));
  expectNoRuntimeFailures(failures);
});

test('arbitrator login rejects invalid backend credentials', async ({ page }) => {
  const failures = collectRuntimeFailures(page);
  await page.goto('/arbitrator/arbitrator_login.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#loginEmail').fill('kabir@gmail.com');
  await page.locator('#loginPassword').fill('wrong-password');
  await page.locator('#loginForm button[type="submit"]').click();

  await expect(page.locator('.sh-app-toast--error')).toContainText(/invalid|password|backend/i);
  await expect(page).toHaveURL(/\/arbitrator\/arbitrator_login\.html/);
  expectNoRuntimeFailures(failures.filter((failure) => !failure.includes('/session/login') && !failure.includes('401 (Unauthorized)')));
});

test('admin login rejects invalid backend credentials instead of creating a local-only session', async ({ page }) => {
  const failures = collectRuntimeFailures(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/admin/admin_landing.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#adminEmail').fill('admin@gmail.com');
  await page.locator('#adminPass').fill('wrong-password');
  await page.locator('#adminLoginForm button[type="submit"]').click();

  await expect(page).toHaveURL(/\/admin\/admin_landing\.html/);
  await expect(page.locator('#pass-error')).toContainText(/invalid|password|backend/i);
  const adminDb = await page.evaluate(() => JSON.parse(localStorage.getItem('admin_db')));
  expect(adminDb.session.isLoggedIn).toBeFalsy();
  expectNoRuntimeFailures(failures.filter((failure) => !failure.includes('/session/login') && !failure.includes('401 (Unauthorized)')));
});

test('admin login persists the actor returned by the backend', async ({ page }) => {
  const failures = collectRuntimeFailures(page);
  await page.goto('/admin/admin_landing.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.locator('#adminEmail').fill('admin@gmail.com');
  await page.locator('#adminPass').fill('123456Ab@');
  await page.locator('#adminLoginForm button[type="submit"]').click();

  await expect(page).toHaveURL(/\/admin\/admin_dashboard\.html/);
  const adminDb = await page.evaluate(() => JSON.parse(localStorage.getItem('admin_db')));
  expect(adminDb.session).toEqual(expect.objectContaining({ actorId: 'user_1001', role: 'admin', isLoggedIn: true }));
  expectNoRuntimeFailures(failures);
});

for (const [role, path] of [
  ['customer', '/customer/customer_dashboard.html'],
  ['provider', '/provider/provider_dashboard.html'],
  ['arbitrator', '/arbitrator/arbitrator_dashboard.html'],
  ['admin', '/admin/admin_dashboard.html'],
]) {
  test(`${role} protected navigation redirects when its session is absent`, async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/login|arbitrator_login|arbitrator_landing|admin_landing/);
    expectNoRuntimeFailures(failures);
  });
}
