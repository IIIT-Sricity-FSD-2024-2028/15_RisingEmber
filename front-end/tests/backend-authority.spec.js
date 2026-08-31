import { expect, test } from '@playwright/test';

test('a rejected customer booking is not cached as a successful local mutation', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('serviceHub_customer_session', JSON.stringify({
      id: 'user_2001',
      name: 'Aarav Mehta',
      email: 'aarav@gmail.com',
      role: 'customer',
      isLoggedIn: true
    }));
    localStorage.setItem('serviceHub_user', JSON.stringify({
      id: 'user_2001',
      name: 'Aarav Mehta',
      email: 'aarav@gmail.com',
      role: 'customer'
    }));
  });

  await page.route('**/api/v1/bookings', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Simulated booking service outage.' })
      });
      return;
    }
    await route.continue();
  });

  await page.goto('/customer/customer_dashboard.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => window.CustomerApp && window.CustomerApp.ready);

  const before = await page.evaluate(() => localStorage.getItem('serviceHub_bookings'));
  const outcome = await page.evaluate(async () => {
    try {
      await window.CustomerApp.createCustomerBooking({
        serviceId: 'service_5001',
        date: '2026-09-03',
        time: '10:00 AM',
        address: 'Powai, Mumbai'
      });
      return { ok: true, bookings: localStorage.getItem('serviceHub_bookings') };
    } catch (error) {
      return { ok: false, message: error && error.message, bookings: localStorage.getItem('serviceHub_bookings') };
    }
  });

  expect(outcome.ok).toBe(false);
  expect(outcome.message).toMatch(/simulated|outage|backend/i);
  expect(outcome.bookings).toBe(before);
});
