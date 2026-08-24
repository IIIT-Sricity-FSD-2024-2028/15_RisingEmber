import { expect, test } from '@playwright/test';
import { collectRuntimeFailures, expectNoRuntimeFailures } from './helpers/servicehub.js';

const customerCredentials = {
  email: 'aarav@servicehub.test',
  password: 'customer123',
};

const providerCredentials = {
  email: 'rohan@servicehub.test',
  password: 'provider123',
};

function futureBookingDate() {
  const date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

async function loginProvider(page) {
  await page.goto('/provider/login.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#loginEmail').fill(providerCredentials.email);
  await page.locator('#loginPassword').fill(providerCredentials.password);
  await page.locator('#loginForm button[type="submit"]').click();
  await expect(page).toHaveURL(/\/provider\/provider_dashboard\.html/);
}

async function loginCustomer(page) {
  await page.goto('/customer/login.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#loginIdentifier').fill(customerCredentials.email);
  await page.locator('#loginPassword').fill(customerCredentials.password);
  await page.locator('#customerLoginForm button[type="submit"]').click();
  await expect(page).toHaveURL(/\/customer\/customer_dashboard\.html/);
}

test('provider and customer can complete the marketplace golden workflow', async ({ browser }) => {
  const providerContext = await browser.newContext();
  const customerContext = await browser.newContext();
  const providerPage = await providerContext.newPage();
  const customerPage = await customerContext.newPage();
  const providerFailures = collectRuntimeFailures(providerPage);
  const customerFailures = collectRuntimeFailures(customerPage);
  const serviceTitle = `Evaluation Home Refresh ${Date.now()}`;
  const bookingDate = futureBookingDate();
  let serviceId;
  let bookingId;

  try {
    await loginProvider(providerPage);
    await providerPage.goto('/provider/add-service.html', { waitUntil: 'domcontentloaded' });
    await providerPage.locator('#serviceName').fill(serviceTitle);
    await providerPage.locator('#serviceCategory').selectOption({ label: 'Cleaning' });
    await providerPage.locator('#servicePrice').fill('1800');
    await providerPage.locator('#serviceDuration').selectOption({ label: 'Fixed (1-2 Hours)' });
    await providerPage.locator('#serviceDesc').fill('A reliable home refresh package for the evaluation walkthrough.');

    const createServiceResponse = providerPage.waitForResponse((response) => (
      response.url().includes('/api/v1/services') && response.request().method() === 'POST'
    ));
    await providerPage.locator('#saveServiceBtn').click();
    const serviceResponse = await createServiceResponse;
    expect(serviceResponse.status()).toBe(201);
    serviceId = (await serviceResponse.json()).data.id;
    expect(serviceId).toMatch(/^service_/);

    await expect(providerPage).toHaveURL(/\/provider\/services\.html/);
    const providerServiceCard = providerPage.locator('.service-card').filter({ hasText: serviceTitle });
    await expect(providerServiceCard).toHaveCount(1);

    await loginCustomer(customerPage);
    await customerPage.goto('/customer/browse-services.html', { waitUntil: 'domcontentloaded' });
    const customerServiceCard = customerPage.locator('.service-card').filter({ hasText: serviceTitle });
    await expect(customerServiceCard).toHaveCount(1);
    await customerServiceCard.locator('.btn-view-details').click();
    await expect(customerPage).toHaveURL(/\/customer\/service-details\.html/);
    await expect(customerPage.locator('#detail-title')).toHaveText(serviceTitle);

    await customerPage.locator('#booking-date').fill(bookingDate);
    await customerPage.locator('.time-btn:not(.disabled)').first().click();
    await customerPage.locator('#book-service-btn').click();
    await expect(customerPage).toHaveURL(/\/customer\/book-service\.html/);
    await customerPage.locator('#serviceAddress').fill('Building 7, Powai, Mumbai');
    await customerPage.locator('#bookingDate').fill(bookingDate);

    const createBookingResponse = customerPage.waitForResponse((response) => (
      response.url().includes('/api/v1/bookings') && response.request().method() === 'POST'
    ));
    await customerPage.locator('#confirmBookingBtn').click();
    const bookingResponse = await createBookingResponse;
    expect(bookingResponse.status()).toBe(201);
    bookingId = (await bookingResponse.json()).data.id;
    expect(bookingId).toMatch(/^booking_/);

    await expect(customerPage).toHaveURL(/\/customer\/booking-confirmation\.html/);
    await expect(customerPage.locator('#confirmId')).toHaveText(bookingId);
    await expect(customerPage.locator('#confirmService')).toHaveText(serviceTitle);

    await providerPage.goto('/provider/jobs.html', { waitUntil: 'domcontentloaded' });
    const providerJobCard = providerPage.locator('.job-card').filter({ hasText: serviceTitle });
    await expect(providerJobCard).toHaveCount(1);
    await expect(providerJobCard).toContainText('Aarav Mehta');
    await providerJobCard.locator('a', { hasText: 'View Details' }).click();
    await expect(providerPage).toHaveURL(new RegExp(`/provider/job-details\\.html\\?id=${bookingId}`));

    const acceptResponse = providerPage.waitForResponse((response) => (
      response.url().includes(`/api/v1/bookings/${bookingId}`) && response.request().method() === 'PATCH'
    ));
    await providerPage.locator('#acceptJobBtn').click();
    expect((await acceptResponse).status()).toBe(200);
    await expect(providerPage.locator('#detailJobStatus')).toHaveText(/active|accepted|confirmed/i);

    await providerPage.locator('#startJobBtn').click();
    await expect(providerPage).toHaveURL(new RegExp(`/provider/track-status\\.html\\?id=${bookingId}`));

    const startResponse = providerPage.waitForResponse((response) => (
      response.url().includes(`/api/v1/bookings/${bookingId}`) && response.request().method() === 'PATCH'
    ));
    await providerPage.locator('#trackStartServiceBtn').click();
    expect((await startResponse).status()).toBe(200);
    await expect(providerPage.locator('#trackTimeline')).toContainText(/Service In Progress/i);

    const completeResponse = providerPage.waitForResponse((response) => (
      response.url().includes(`/api/v1/bookings/${bookingId}`) && response.request().method() === 'PATCH'
    ));
    await providerPage.locator('#trackCompleteJobBtn').click();
    expect((await completeResponse).status()).toBe(200);
    await expect(providerPage.locator('#trackTimeline')).toContainText(/Service Completed/i);

    await customerPage.goto('/customer/my-bookings.html', { waitUntil: 'domcontentloaded' });
    const completedBookingCard = customerPage.locator('.booking-card').filter({ hasText: serviceTitle });
    await expect(completedBookingCard).toHaveCount(1);
    await expect(completedBookingCard).toContainText('Completed');
    await completedBookingCard.locator('.btn-view').click();
    await expect(customerPage).toHaveURL(/\/customer\/booking-details\.html/);
    await expect(customerPage.locator('#disp-title')).toHaveText(serviceTitle);
    await expect(customerPage.locator('#disp-status')).toHaveText('Completed');

    // The current customer portal exposes review results but has no review-write
    // form or handler, so submit through its real API adapter and verify the
    // resulting review on the existing read-only service-details surface.
    const reviewResponse = customerPage.waitForResponse((response) => (
      response.url().includes('/api/v1/reviews') && response.request().method() === 'POST'
    ));
    const review = await customerPage.evaluate(async (currentBookingId) => (
      window.CustomerApp.requestCustomerApi('/reviews', {
        method: 'POST',
        headers: {
          'x-role': 'customer',
          'x-actor-id': 'user_2001',
        },
        body: {
          bookingId: currentBookingId,
          rating: 5,
          comment: 'Excellent evaluation service.',
        },
      })
    ), bookingId);
    expect((await reviewResponse).status()).toBe(201);
    expect(review).toEqual(expect.objectContaining({
        bookingId,
        rating: 5,
        comment: 'Excellent evaluation service.',
    }));

    await customerPage.goto('/customer/service-details.html', { waitUntil: 'domcontentloaded' });
    await expect(customerPage.locator('#detail-title')).toHaveText(serviceTitle);
    await expect(customerPage.locator('#reviews-container .review-card')).toContainText('Excellent evaluation service.');
  } finally {
    expectNoRuntimeFailures(providerFailures);
    expectNoRuntimeFailures(customerFailures);
    await providerContext.close();
    await customerContext.close();
  }
});
