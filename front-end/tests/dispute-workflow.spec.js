import { expect, test } from '@playwright/test';
import { collectRuntimeFailures, expectNoRuntimeFailures } from './helpers/servicehub.js';

async function loginCustomer(page) {
  await page.goto('/customer/login.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#loginIdentifier').fill('siya@gmail.com');
  await page.locator('#loginPassword').fill('123456Ab@');
  await page.locator('#customerLoginForm button[type="submit"]').click();
  await expect(page).toHaveURL(/\/customer\/customer_dashboard\.html/);
}

async function loginProvider(page) {
  await page.goto('/provider/login.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#loginEmail').fill('neha@gmail.com');
  await page.locator('#loginPassword').fill('123456Ab@');
  await page.locator('#loginForm button[type="submit"]').click();
  await expect(page).toHaveURL(/\/provider\/provider_dashboard\.html/);
}

async function loginArbitrator(page) {
  await page.goto('/arbitrator/arbitrator_login.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#loginEmail').fill('kabir@gmail.com');
  await page.locator('#loginPassword').fill('123456Ab@');
  await page.locator('#loginForm button[type="submit"]').click();
  await expect(page).toHaveURL(/\/arbitrator\/arbitrator_dashboard\.html/);
}

async function loginAdmin(page) {
  await page.goto('/admin/admin_landing.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#adminEmail').fill('admin@gmail.com');
  await page.locator('#adminPass').fill('123456Ab@');
  await page.locator('#adminLoginForm button[type="submit"]').click();
  await expect(page).toHaveURL(/\/admin\/admin_dashboard\.html/);
}

test('the prepared dispute can be reviewed, awarded, and observed by every role', async ({ browser }) => {
  const customerContext = await browser.newContext();
  const providerContext = await browser.newContext();
  const arbitratorContext = await browser.newContext();
  const adminContext = await browser.newContext();
  const customerPage = await customerContext.newPage();
  const providerPage = await providerContext.newPage();
  const arbitratorPage = await arbitratorContext.newPage();
  const adminPage = await adminContext.newPage();
  const customerFailures = collectRuntimeFailures(customerPage);
  const providerFailures = collectRuntimeFailures(providerPage);
  const arbitratorFailures = collectRuntimeFailures(arbitratorPage);
  const adminFailures = collectRuntimeFailures(adminPage);

  try {
    await loginCustomer(customerPage);
    await customerPage.goto('/customer/disputes.html', { waitUntil: 'domcontentloaded' });
    const customerCaseCard = customerPage.locator('#disputes-list .card').filter({ hasText: 'Washing Machine Repair Visit' });
    await expect(customerCaseCard).toHaveCount(1);
    await expect(customerCaseCard).toContainText(/Under Review/i);
    await customerCaseCard.locator('.btn-view-dispute').click();
    await expect(customerPage).toHaveURL(/\/customer\/dispute-status\.html/);
    await expect(customerPage.locator('#statusDisputeId')).toHaveText('case_8001');
    await expect(customerPage.locator('#statusBadge')).toContainText(/Under Review/i);

    await loginArbitrator(arbitratorPage);
    await arbitratorPage.goto('/arbitrator/arbitrator_hearings.html?case=case_8001', { waitUntil: 'domcontentloaded' });
    await expect(arbitratorPage.locator('#schedule-id')).toHaveValue('case_8001');
    await expect(arbitratorPage.locator('#hearings-tbody')).toContainText('case_8001');

    await arbitratorPage.goto('/arbitrator/arbitrator_messages.html?case=case_8001', { waitUntil: 'domcontentloaded' });
    await expect(arbitratorPage.locator('#chatMessages')).toContainText('The machine started leaking again within 24 hours of the repair visit.');
    const messageResponse = arbitratorPage.waitForResponse((response) => (
      response.url().includes('/api/v1/cases/case_8001') && response.request().method() === 'PATCH'
    ));
    await arbitratorPage.locator('#msgInput').fill('The hearing record is ready for the final award.');
    await arbitratorPage.locator('#sendBtn').click();
    expect((await messageResponse).status()).toBe(200);
    await expect(arbitratorPage.locator('#chatMessages')).toContainText('The hearing record is ready for the final award.');

    await arbitratorPage.goto('/arbitrator/arbitrator_case_details.html?case=case_8001', { waitUntil: 'domcontentloaded' });
    await expect(arbitratorPage.locator('#case-detail-title')).toContainText('case_8001');
    await expect(arbitratorPage.locator('#doc-list-body')).toContainText('leakage-photos.zip');

    await arbitratorPage.evaluate(() => window.triggerFileUpload('Order'));
    const evidenceResponse = arbitratorPage.waitForResponse((response) => (
      response.url().endsWith('/api/v1/documents') && response.request().method() === 'POST'
    ));
    await arbitratorPage.locator('#caseFileUpload').setInputFiles({
      name: 'hearing-notes.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 evaluation hearing notes'),
    });
    expect((await evidenceResponse).status()).toBe(201);
    await expect(arbitratorPage.locator('#doc-list-body')).toContainText('hearing-notes.pdf');

    await arbitratorPage.evaluate(() => window.triggerFileUpload('Decision'));
    const awardRequest = arbitratorPage.waitForRequest((request) => (
      request.url().endsWith('/api/v1/awards/award_12001') && request.method() === 'PATCH'
    ));
    const awardResponse = arbitratorPage.waitForResponse((response) => (
      response.url().endsWith('/api/v1/awards/award_12001') && response.request().method() === 'PATCH'
    ));
    await arbitratorPage.locator('#caseFileUpload').setInputFiles({
      name: 'final-award.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 final award'),
    });
    expect((await awardResponse).status()).toBe(200);
    expect((await awardRequest).postDataJSON()).toEqual(expect.objectContaining({
      status: 'issued',
      decision: 'refund_to_customer',
    }));
    await expect(arbitratorPage.locator('#doc-list-body')).toContainText('final-award.pdf');

    await customerPage.goto('/customer/disputes.html', { waitUntil: 'domcontentloaded' });
    const resolvedCustomerCase = customerPage.locator('#disputes-list .card').filter({ hasText: 'Washing Machine Repair Visit' });
    await expect(resolvedCustomerCase).toContainText(/Resolved/i);
    await resolvedCustomerCase.locator('.btn-view-dispute').click();
    await expect(customerPage).toHaveURL(/\/customer\/dispute-status\.html/);
    await expect(customerPage.locator('#statusBadge')).toContainText(/Resolved/i);

    await loginProvider(providerPage);
    await providerPage.goto('/provider/disputes.html', { waitUntil: 'domcontentloaded' });
    await expect(providerPage.locator('#providerDisputesBody')).toContainText('case_8001');
    await expect(providerPage.locator('#providerDisputesBody')).toContainText(/Resolved/i);

    await loginAdmin(adminPage);
    await adminPage.goto('/admin/admin_cases.html', { waitUntil: 'domcontentloaded' });
    const resolvedAdminRow = adminPage.locator('#case-table-body tr').filter({ hasText: 'case_8001' });
    await expect(resolvedAdminRow).toHaveCount(1);
    await expect(resolvedAdminRow).toContainText(/Closed|Resolved/i);
  } finally {
    expectNoRuntimeFailures(customerFailures);
    expectNoRuntimeFailures(providerFailures);
    expectNoRuntimeFailures(arbitratorFailures);
    expectNoRuntimeFailures(adminFailures);
    await customerContext.close();
    await providerContext.close();
    await arbitratorContext.close();
    await adminContext.close();
  }
});

test('the hearing calendar ignores impossible calendar dates', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const failures = collectRuntimeFailures(page);

  try {
    await loginArbitrator(page);
    await page.goto('/arbitrator/arbitrator_hearings.html', { waitUntil: 'domcontentloaded' });

    const overflowEvents = await page.evaluate(() => {
      const hearings = window.ArbitratorData.hearingsList;
      window.ArbitratorData.hearingsList = [...hearings, {
        id: 'invalid-date-case',
        parties: 'Invalid Date Test',
        date: '31 Feb 2026',
        time: '10:00 AM',
        type: 'Virtual Hearing',
        status: 'Scheduled',
        statusClass: 'arb-badge-blue',
        hearingId: 'invalid-date-hearing'
      }];
      window.renderHearingsTable();
      return Array.from(document.querySelectorAll('.cal-date'))
        .filter((element) => element.classList.contains('has-event') && element.textContent.trim() === '3')
        .length;
    });

    expect(overflowEvents).toBe(0);
    expectNoRuntimeFailures(failures);
  } finally {
    await context.close();
  }
});
