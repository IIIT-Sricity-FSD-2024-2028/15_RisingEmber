import { expect, test } from '@playwright/test';
import { collectRuntimeFailures, expectNoRuntimeFailures } from './helpers/servicehub.js';

const providerPages = [
  '/provider/login.html',
  '/provider/signup.html',
  '/provider/provider_dashboard.html',
  '/provider/services.html',
  '/provider/jobs.html',
  '/provider/job-details.html?id=booking_6001',
  '/provider/track-status.html?id=booking_6001',
  '/provider/disputes.html',
  '/provider/raise-dispute.html?id=booking_6001',
  '/provider/earnings.html',
  '/provider/profile.html',
  '/provider/add-service.html',
  '/provider/edit-service.html?id=service_5001',
  '/provider/update-status.html?id=booking_6001',
];

const protectedProviderPages = providerPages.slice(2);

async function expectProviderPageContent(page) {
  await expect(page.locator('h1').first()).toBeVisible();
}

async function loginProvider(page) {
  await page.goto('/provider/login.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#loginEmail').fill('rohan@gmail.com');
  await page.locator('#loginPassword').fill('123456Ab@');
  await page.locator('#loginForm button[type="submit"]').click();
  await expect(page).toHaveURL(/\/provider\/provider_dashboard\.html/);
}

async function setStaleProviderStorage(page) {
  await page.evaluate(() => {
    localStorage.setItem('sh_db_v2_clean', 'true');
    localStorage.setItem('sh_provider', '{stale-json');
    localStorage.setItem('sh_services', JSON.stringify({ stale: true }));
    localStorage.setItem('sh_jobs', JSON.stringify(null));
    localStorage.setItem('sh_disputes', JSON.stringify('stale'));
  });
}

test('all provider pages boot after a real backend sign-in', async ({ page }) => {
  const failures = collectRuntimeFailures(page);

  await page.goto('/provider/login.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expectProviderPageContent(page);

  await page.goto('/provider/signup.html', { waitUntil: 'domcontentloaded' });
  await expectProviderPageContent(page);

  await loginProvider(page);
  for (const path of protectedProviderPages) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expectProviderPageContent(page);
  }

  expectNoRuntimeFailures(failures);
});

test('all provider pages tolerate stale browser data after a real backend sign-in', async ({ page }) => {
  const failures = collectRuntimeFailures(page);

  await page.goto('/provider/login.html', { waitUntil: 'domcontentloaded' });
  await setStaleProviderStorage(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expectProviderPageContent(page);

  await page.goto('/provider/signup.html', { waitUntil: 'domcontentloaded' });
  await setStaleProviderStorage(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expectProviderPageContent(page);

  await page.goto('/provider/login.html', { waitUntil: 'domcontentloaded' });
  await setStaleProviderStorage(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await loginProvider(page);

  for (const path of protectedProviderPages) {
    await setStaleProviderStorage(page);
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expectProviderPageContent(page);
  }

  expectNoRuntimeFailures(failures);
});
