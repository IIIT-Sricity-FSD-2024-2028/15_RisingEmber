import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  collectEvaluationEvidence,
  expectNoEvaluationFailures,
} from './helpers/servicehub.js';

const API_BASE_URL = 'http://127.0.0.1:3000/api/v1';

const ACTORS = {
  customer: { role: 'customer', id: 'user_2001', email: 'aarav@servicehub.test', password: 'customer123' },
  disputeCustomer: { role: 'customer', id: 'user_2002', email: 'siya@servicehub.test', password: 'customer123' },
  provider: { role: 'provider', id: 'user_3001', email: 'rohan@servicehub.test', password: 'provider123' },
  disputeProvider: { role: 'provider', id: 'user_3002', email: 'neha@servicehub.test', password: 'provider123' },
  arbitrator: { role: 'arbitrator', id: 'user_4001', email: 'kabir@servicehub.test', password: 'arbitrator123' },
  admin: { role: 'admin', id: 'user_1001', email: 'admin@servicehub.test', password: 'admin123' },
};

const WORKFLOW_IDS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10'];

function futureDate(days = 5) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function actorHeaders(actor, extra = {}) {
  return {
    'x-role': actor.role,
    'x-actor-id': actor.id,
    ...extra,
  };
}

async function apiRequest(request, method, path, actor, data, extraHeaders = {}) {
  const response = await request.fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: actor ? actorHeaders(actor, extraHeaders) : extraHeaders,
    ...(data === undefined ? {} : { data }),
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // The evaluator reports the status and headers below for non-JSON failures.
  }
  return { response, payload };
}

async function loginRole(page, role, actor = ACTORS[role]) {
  const loginPath = {
    customer: '/customer/login.html',
    provider: '/provider/login.html',
    arbitrator: '/arbitrator/arbitrator_login.html',
    admin: '/admin/admin_landing.html',
  }[role];
  if (!loginPath || !actor) throw new Error(`Unsupported ServiceHub role: ${role}`);

  await page.goto(loginPath, { waitUntil: 'domcontentloaded' });
  if (role === 'customer') {
    await page.locator('#loginIdentifier').fill(actor.email);
    await page.locator('#loginPassword').fill(actor.password);
    await page.locator('#customerLoginForm button[type="submit"]').click();
    await expect(page).toHaveURL(/\/customer\/customer_dashboard\.html/);
  } else if (role === 'admin') {
    await page.locator('#adminEmail').fill(actor.email);
    await page.locator('#adminPass').fill(actor.password);
    await page.locator('#adminLoginForm button[type="submit"]').click();
    await expect(page).toHaveURL(/\/admin\/admin_dashboard\.html/);
  } else {
    await page.locator('#loginEmail').fill(actor.email);
    await page.locator('#loginPassword').fill(actor.password);
    await page.locator('#loginForm button[type="submit"]').click();
    await expect(page).toHaveURL(new RegExp(`/${role === 'arbitrator' ? 'arbitrator' : 'provider'}/.*dashboard\\.html`));
  }
}

async function runPublicWorkflow(visitorPage) {
  await visitorPage.goto('/Landing_Page/index.html', { waitUntil: 'domcontentloaded' });
  await expect(visitorPage).toHaveTitle(/ServiceHub/i);
  await expect(visitorPage.locator('#services .service-card')).toHaveCount(4);

  await visitorPage.goto('/Landing_Page/post-job.html', { waitUntil: 'domcontentloaded' });
  await visitorPage.locator('#postJobForm button[type="submit"]').click();
  await expect(visitorPage.locator('#postJobStatus')).toContainText(/fix the highlighted fields/i);

  await visitorPage.locator('#serviceCategory').selectOption('Cleaning');
  await visitorPage.locator('#postalCode').fill('400001');
  await visitorPage.locator('#projectDetails').fill('The evaluation walkthrough needs a complete home cleaning visit.');
  await visitorPage.locator('#serviceDate').fill(futureDate(8));
  const jobRequest = visitorPage.waitForResponse((response) => (
    response.url().endsWith('/api/v1/intake/job-requests') && response.request().method() === 'POST'
  ));
  await visitorPage.locator('#postJobForm button[type="submit"]').click();
  expect((await jobRequest).status()).toBe(201);
  await expect(visitorPage.locator('#postJobStatus')).toContainText(/submitted successfully/i);

  await visitorPage.goto('/Landing_Page/contact.html', { waitUntil: 'domcontentloaded' });
  await visitorPage.locator('#contactForm button[type="submit"]').click();
  await expect(visitorPage.locator('#contactFormStatus')).toContainText(/correct|required/i);
  await visitorPage.locator('#contactFirstName').fill('Evaluation');
  await visitorPage.locator('#contactLastName').fill('Visitor');
  await visitorPage.locator('#contactEmail').fill(`evaluation-${Date.now()}@servicehub.test`);
  await visitorPage.locator('#contactTopic').selectOption({ label: 'Other' });
  await visitorPage.locator('#contactMessage').fill('Please confirm that public contact intake is available for the evaluation.');
  const contactRequest = visitorPage.waitForResponse((response) => (
    response.url().endsWith('/api/v1/intake/contact-messages') && response.request().method() === 'POST'
  ));
  await visitorPage.locator('#contactForm button[type="submit"]').click();
  expect((await contactRequest).status()).toBe(201);
  await expect(visitorPage.locator('#contactFormStatus')).toContainText(/sent successfully/i);
}

async function runAuthenticationAndProfileWorkflow(customerPage, providerPage, arbitratorPage, adminPage, browser) {
  await loginRole(customerPage, 'customer');
  await loginRole(providerPage, 'provider');
  await loginRole(arbitratorPage, 'arbitrator');
  await loginRole(adminPage, 'admin');

  const wrongContext = await browser.newContext();
  const wrongPage = await wrongContext.newPage();
  try {
    await wrongPage.goto('/customer/login.html', { waitUntil: 'domcontentloaded' });
    await wrongPage.locator('#loginIdentifier').fill(ACTORS.customer.email);
    await wrongPage.locator('#loginPassword').fill('definitely-wrong');
    await wrongPage.locator('#customerLoginForm button[type="submit"]').click();
    await expect(wrongPage.locator('#loginMessage')).toBeVisible();
    await expect(wrongPage.locator('#loginMessage')).toContainText(/invalid|incorrect|credential/i);
  } finally {
    await wrongContext.close();
  }

  await customerPage.goto('/customer/profile.html', { waitUntil: 'domcontentloaded' });
  const originalPhone = await customerPage.locator('#profile-phone').inputValue();
  const evaluationPhone = '9999999988';
  await customerPage.locator('#edit-profile-btn').click();
  await customerPage.locator('#profile-phone').fill(evaluationPhone);
  const saveProfile = customerPage.waitForResponse((response) => (
    response.url().endsWith('/api/v1/users/me') && response.request().method() === 'PATCH'
  ));
  await customerPage.locator('#save-profile-btn').click();
  expect((await saveProfile).status()).toBe(200);
  await expect(customerPage.locator('#profile-success-msg')).toBeVisible();
  await customerPage.reload({ waitUntil: 'domcontentloaded' });
  await expect(customerPage.locator('#profile-phone')).toHaveValue(evaluationPhone);

  await customerPage.locator('#edit-profile-btn').click();
  await customerPage.locator('#profile-phone').fill(originalPhone);
  const restoreProfile = customerPage.waitForResponse((response) => (
    response.url().endsWith('/api/v1/users/me') && response.request().method() === 'PATCH'
  ));
  await customerPage.locator('#save-profile-btn').click();
  expect((await restoreProfile).status()).toBe(200);
}

async function runMarketplaceWorkflow(providerPage, customerPage) {
  const serviceTitle = `Evaluation Walkthrough Service ${Date.now()}`;
  const bookingDate = futureDate(7);
  let serviceId;
  let bookingId;

  await providerPage.goto('/provider/add-service.html', { waitUntil: 'domcontentloaded' });
  await providerPage.locator('#serviceName').fill(serviceTitle);
  await providerPage.locator('#serviceCategory').selectOption({ label: 'Cleaning' });
  await providerPage.locator('#servicePrice').fill('1800');
  await providerPage.locator('#serviceDuration').selectOption({ label: 'Fixed (1-2 Hours)' });
  await providerPage.locator('#serviceDesc').fill('A reliable home refresh package for the evaluation walkthrough.');
  const createServiceResponse = providerPage.waitForResponse((response) => (
    response.url().endsWith('/api/v1/services') && response.request().method() === 'POST'
  ));
  await providerPage.locator('#saveServiceBtn').click();
  const serviceResponse = await createServiceResponse;
  expect(serviceResponse.status()).toBe(201);
  serviceId = (await serviceResponse.json()).data.id;
  expect(serviceId).toMatch(/^service_/);
  await expect(providerPage).toHaveURL(/\/provider\/services\.html/);
  await expect(providerPage.locator('.service-card').filter({ hasText: serviceTitle })).toHaveCount(1);

  await customerPage.goto('/customer/browse-services.html', { waitUntil: 'domcontentloaded' });
  const serviceCard = customerPage.locator('.service-card').filter({ hasText: serviceTitle });
  await expect(serviceCard).toHaveCount(1);
  await serviceCard.locator('.btn-view-details').click();
  await expect(customerPage).toHaveURL(/\/customer\/service-details\.html/);
  await expect(customerPage.locator('#detail-title')).toHaveText(serviceTitle);
  await customerPage.locator('#booking-date').fill(bookingDate);
  await customerPage.locator('.time-btn:not(.disabled)').first().click();
  await customerPage.locator('#book-service-btn').click();
  await expect(customerPage).toHaveURL(/\/customer\/book-service\.html/);
  await customerPage.locator('#serviceAddress').fill('Building 7, Powai, Mumbai');
  await customerPage.locator('#bookingDate').fill(bookingDate);
  const createBookingResponse = customerPage.waitForResponse((response) => (
    response.url().endsWith('/api/v1/bookings') && response.request().method() === 'POST'
  ));
  await customerPage.locator('#confirmBookingBtn').click();
  const bookingResponse = await createBookingResponse;
  expect(bookingResponse.status()).toBe(201);
  bookingId = (await bookingResponse.json()).data.id;
  expect(bookingId).toMatch(/^booking_/);
  await expect(customerPage).toHaveURL(/\/customer\/booking-confirmation\.html/);
  await expect(customerPage.locator('#confirmId')).toHaveText(bookingId);

  await providerPage.goto('/provider/jobs.html', { waitUntil: 'domcontentloaded' });
  const jobCard = providerPage.locator('.job-card').filter({ hasText: serviceTitle });
  await expect(jobCard).toHaveCount(1);
  await jobCard.locator('a', { hasText: 'View Details' }).click();
  await expect(providerPage).toHaveURL(new RegExp(`/provider/job-details\\.html\\?id=${bookingId}`));
  const acceptResponse = providerPage.waitForResponse((response) => (
    response.url().endsWith(`/api/v1/bookings/${bookingId}`) && response.request().method() === 'PATCH'
  ));
  await providerPage.locator('#acceptJobBtn').click();
  expect((await acceptResponse).status()).toBe(200);
  await expect(providerPage.locator('#detailJobStatus')).toHaveText(/active|accepted|confirmed/i);
  await providerPage.locator('#startJobBtn').click();
  await expect(providerPage).toHaveURL(new RegExp(`/provider/track-status\\.html\\?id=${bookingId}`));
  const startResponse = providerPage.waitForResponse((response) => (
    response.url().endsWith(`/api/v1/bookings/${bookingId}`) && response.request().method() === 'PATCH'
  ));
  await providerPage.locator('#trackStartServiceBtn').click();
  expect((await startResponse).status()).toBe(200);
  await expect(providerPage.locator('#trackTimeline')).toContainText(/Service In Progress/i);
  const completeResponse = providerPage.waitForResponse((response) => (
    response.url().endsWith(`/api/v1/bookings/${bookingId}`) && response.request().method() === 'PATCH'
  ));
  await providerPage.locator('#trackCompleteJobBtn').click();
  expect((await completeResponse).status()).toBe(200);
  await expect(providerPage.locator('#trackTimeline')).toContainText(/Service Completed/i);

  const completedBookingAuthority = await customerPage.evaluate(async (currentBookingId) => (
    window.CustomerApp.requestCustomerApi(`/bookings/${currentBookingId}`, {
      headers: { 'x-role': 'customer', 'x-actor-id': 'user_2001' },
    })
  ), bookingId);
  expect(completedBookingAuthority).toEqual(expect.objectContaining({
    id: bookingId,
    status: 'completed',
    escrowStatus: 'released',
  }));

  await customerPage.goto('/customer/my-bookings.html', { waitUntil: 'domcontentloaded' });
  const completedBooking = customerPage.locator('.booking-card').filter({ hasText: serviceTitle });
  await expect(completedBooking).toHaveCount(1);
  await expect(completedBooking).toContainText('Completed');
  await completedBooking.locator('.btn-view').click();
  await expect(customerPage.locator('#disp-status')).toHaveText('Completed');

  const reviewResponse = customerPage.waitForResponse((response) => (
    response.url().endsWith('/api/v1/reviews') && response.request().method() === 'POST'
  ));
  const review = await customerPage.evaluate(async (currentBookingId) => (
    window.CustomerApp.requestCustomerApi('/reviews', {
      method: 'POST',
      headers: { 'x-role': 'customer', 'x-actor-id': 'user_2001' },
      body: { bookingId: currentBookingId, rating: 5, comment: 'Excellent evaluation walkthrough service.' },
    })
  ), bookingId);
  expect((await reviewResponse).status()).toBe(201);
  expect(review).toEqual(expect.objectContaining({ bookingId, rating: 5 }));
  await customerPage.goto('/customer/service-details.html', { waitUntil: 'domcontentloaded' });
  await expect(customerPage.locator('#reviews-container .review-card')).toContainText('Excellent evaluation walkthrough service.');
  return { serviceId, bookingId, serviceTitle };
}

async function runDisputeWorkflow(siyaPage, nehaPage, arbitratorPage, adminPage) {
  await loginRole(siyaPage, 'customer', ACTORS.disputeCustomer);
  await loginRole(nehaPage, 'provider', ACTORS.disputeProvider);

  await siyaPage.goto('/customer/disputes.html', { waitUntil: 'domcontentloaded' });
  const caseCard = siyaPage.locator('#disputes-list .card').filter({ hasText: 'Washing Machine Repair Visit' });
  await expect(caseCard).toHaveCount(1);
  await expect(caseCard).toContainText(/Under Review|Hearing Scheduled|Resolved/i);
  await caseCard.locator('.btn-view-dispute').click();
  await expect(siyaPage).toHaveURL(/\/customer\/dispute-status\.html/);
  await expect(siyaPage.locator('#statusDisputeId')).toHaveText('case_8001');

  const caseBeforeResponse = await fetch(`${API_BASE_URL}/cases/case_8001`, { headers: actorHeaders(ACTORS.disputeCustomer) });
  const caseBeforeBody = await caseBeforeResponse.json();
  const bookingBeforeResponse = await fetch(`${API_BASE_URL}/bookings/booking_6002`, { headers: actorHeaders(ACTORS.disputeCustomer) });
  const bookingBeforeBody = await bookingBeforeResponse.json();
  expect(caseBeforeResponse.status).toBe(200);
  expect(caseBeforeBody.data.bookingId).toBe('booking_6002');
  expect(['funds_locked', 'refunded']).toContain(bookingBeforeBody.data.escrowStatus);

  const awardBeforeResponse = await fetch(`${API_BASE_URL}/awards?caseId=case_8001`, { headers: actorHeaders(ACTORS.arbitrator) });
  const awardBeforeBody = await awardBeforeResponse.json();
  const preparedAward = awardBeforeBody.data.find((award) => award.id === 'award_12001');
  expect(preparedAward).toBeTruthy();

  if (preparedAward.status !== 'issued' && caseBeforeBody.data.status !== 'resolved') {
    await arbitratorPage.goto('/arbitrator/arbitrator_hearings.html?case=case_8001', { waitUntil: 'domcontentloaded' });
    await expect(arbitratorPage.locator('#schedule-id')).toHaveValue('case_8001');
    await expect(arbitratorPage.locator('#hearings-tbody')).toContainText('case_8001');

    await arbitratorPage.goto('/arbitrator/arbitrator_messages.html?case=case_8001', { waitUntil: 'domcontentloaded' });
    await expect(arbitratorPage.locator('#chatMessages')).toContainText('machine started leaking');
    const messageResponse = arbitratorPage.waitForResponse((response) => (
      response.url().includes('/api/v1/cases/case_8001') && response.request().method() === 'PATCH'
    ));
    await arbitratorPage.locator('#msgInput').fill('The evaluation hearing record is ready for the final award.');
    await arbitratorPage.locator('#sendBtn').click();
    expect((await messageResponse).status()).toBe(200);
    await expect(arbitratorPage.locator('#chatMessages')).toContainText('evaluation hearing record');

    await arbitratorPage.goto('/arbitrator/arbitrator_case_details.html?case=case_8001', { waitUntil: 'domcontentloaded' });
    await expect(arbitratorPage.locator('#case-detail-title')).toContainText('case_8001');
    await expect(arbitratorPage.locator('#doc-list-body')).toContainText('leakage-photos.zip');
    await arbitratorPage.evaluate(() => window.triggerFileUpload('Order'));
    const evidenceResponse = arbitratorPage.waitForResponse((response) => (
      response.url().endsWith('/api/v1/documents') && response.request().method() === 'POST'
    ));
    await arbitratorPage.locator('#caseFileUpload').setInputFiles({
      name: 'evaluation-hearing-notes.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 evaluation hearing notes'),
    });
    expect((await evidenceResponse).status()).toBe(201);
    await expect(arbitratorPage.locator('#doc-list-body')).toContainText('evaluation-hearing-notes.pdf');

    await arbitratorPage.evaluate(() => window.triggerFileUpload('Decision'));
    const awardResponse = arbitratorPage.waitForResponse((response) => (
      response.url().endsWith('/api/v1/awards/award_12001') && response.request().method() === 'PATCH'
    ));
    await arbitratorPage.locator('#caseFileUpload').setInputFiles({
      name: 'evaluation-final-award.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 evaluation final award'),
    });
    expect((await awardResponse).status()).toBe(200);
  }

  const finalCaseResponse = await fetch(`${API_BASE_URL}/cases/case_8001`, { headers: actorHeaders(ACTORS.disputeCustomer) });
  const finalCaseBody = await finalCaseResponse.json();
  const finalBookingResponse = await fetch(`${API_BASE_URL}/bookings/booking_6002`, { headers: actorHeaders(ACTORS.disputeCustomer) });
  const finalBookingBody = await finalBookingResponse.json();
  const finalAwardResponse = await fetch(`${API_BASE_URL}/awards?caseId=case_8001`, { headers: actorHeaders(ACTORS.arbitrator) });
  const finalAwardBody = await finalAwardResponse.json();
  expect(['resolved', 'closed']).toContain(finalCaseBody.data.status);
  expect(finalAwardBody.data.find((award) => award.id === 'award_12001').status).toBe('issued');
  expect(finalBookingBody.data.status).toBe('cancelled');
  expect(finalBookingBody.data.escrowStatus).toBe('refunded');

  await siyaPage.goto('/customer/disputes.html', { waitUntil: 'domcontentloaded' });
  await expect(siyaPage.locator('#disputes-list')).toContainText(/Resolved/i);
  await nehaPage.goto('/provider/disputes.html', { waitUntil: 'domcontentloaded' });
  await expect(nehaPage.locator('#providerDisputesBody')).toContainText('case_8001');
  await expect(nehaPage.locator('#providerDisputesBody')).toContainText(/Resolved|Closed/i);
  await adminPage.goto('/admin/admin_cases.html', { waitUntil: 'domcontentloaded' });
  await expect(adminPage.locator('#case-table-body')).toContainText('case_8001');
}

async function runFreshDisputeCreation(customerPage, providerPage, arbitratorPage, adminPage) {
  const existingCases = await customerPage.evaluate(async () => (
    window.CustomerApp.requestCustomerApi('/cases?bookingId=booking_6001', {
      headers: { 'x-role': 'customer', 'x-actor-id': 'user_2001' },
    })
  ));
  let createdCase = Array.isArray(existingCases) ? existingCases.find((caseRecord) => caseRecord.bookingId === 'booking_6001') : null;

  const bookingBefore = await customerPage.evaluate(async () => (
    window.CustomerApp.requestCustomerApi('/bookings/booking_6001', {
      headers: { 'x-role': 'customer', 'x-actor-id': 'user_2001' },
    })
  ));
  expect(bookingBefore).toEqual(expect.objectContaining({
    id: 'booking_6001',
    escrowStatus: 'funds_locked',
  }));

  if (!createdCase) {
    // Use the current customer dispute form for the creation path. The
    // adapter is exercised by the page itself; this test only supplies the
    // browser state the existing form expects for its confirmed booking.
    await customerPage.evaluate(() => {
      localStorage.setItem('selectedBookingId', 'booking_6001');
      localStorage.removeItem('pendingDisputeContext');
    });
    await customerPage.goto('/customer/raise-dispute.html', { waitUntil: 'domcontentloaded' });
    await expect(customerPage.locator('#disputeBookingId')).toHaveValue('booking_6001');
    await customerPage.locator('#disputeCategory').selectOption('quality');
    await customerPage.locator('#disputeDescription').fill('Too short');
    await customerPage.locator('#disputeForm button[type="submit"]').click();
    await expect(customerPage.locator('#disputeFormMessage')).toBeVisible();
    await expect(customerPage.locator('#disputeFormMessage')).toContainText(/at least 50 characters/i);
    await customerPage.locator('#disputeDescription').fill('The confirmed cleaning appointment needs formal review before the service is completed.');
    const createCaseResponse = customerPage.waitForResponse((response) => (
      response.url().endsWith('/api/v1/cases') && response.request().method() === 'POST'
    ));
    await customerPage.locator('#disputeForm button[type="submit"]').click();
    expect((await createCaseResponse).status()).toBe(201);
    await expect(customerPage).toHaveURL(/\/customer\/dispute-submitted\.html/);
    await expect(customerPage.locator('#submittedDisputeId')).toHaveText(/^case_/);
    const refreshedCases = await customerPage.evaluate(async () => (
      window.CustomerApp.requestCustomerApi('/cases?bookingId=booking_6001', {
        headers: { 'x-role': 'customer', 'x-actor-id': 'user_2001' },
      })
    ));
    createdCase = Array.isArray(refreshedCases)
      ? refreshedCases.find((caseRecord) => caseRecord.bookingId === 'booking_6001')
      : null;
  } else {
    await customerPage.evaluate(() => {
      localStorage.setItem('selectedBookingId', 'booking_6001');
      localStorage.removeItem('pendingDisputeContext');
    });
    await customerPage.goto('/customer/raise-dispute.html', { waitUntil: 'domcontentloaded' });
    await expect(customerPage.locator('#disputeBookingId')).toHaveValue('booking_6001');
  }

  expect(createdCase.id).toMatch(/^case_/);
  expect(createdCase.bookingId).toBe('booking_6001');
  const bookingAfter = await customerPage.evaluate(async () => (
    window.CustomerApp.requestCustomerApi('/bookings/booking_6001', {
      headers: { 'x-role': 'customer', 'x-actor-id': 'user_2001' },
    })
  ));
  expect(bookingAfter).toEqual(expect.objectContaining({
    id: 'booking_6001',
    status: 'disputed',
    escrowStatus: 'funds_locked',
  }));

  await customerPage.goto('/customer/disputes.html', { waitUntil: 'domcontentloaded' });
  const customerCase = customerPage.locator('#disputes-list .card').filter({ hasText: 'Booking: booking_6001' });
  await expect(customerCase).toHaveCount(1);
  await expect(customerCase).toContainText(createdCase.id);

  await providerPage.goto('/provider/disputes.html', { waitUntil: 'domcontentloaded' });
  await expect(providerPage.locator('#providerDisputesBody')).toContainText(createdCase.id);

  await arbitratorPage.goto('/arbitrator/arbitrator_assigned_cases.html', { waitUntil: 'domcontentloaded' });
  await expect(arbitratorPage.locator('#tableBody')).toContainText(createdCase.id);

  await adminPage.goto('/admin/admin_cases.html', { waitUntil: 'domcontentloaded' });
  await expect(adminPage.locator('#case-table-body')).toContainText(createdCase.id);
}

async function runAdminWorkflow(adminPage, request) {
  const targetEmail = `evaluation-phase10-target-${Date.now()}@servicehub.test`;
  const registration = await request.post(`${API_BASE_URL}/customers/register`, {
    data: {
      name: 'Phase Ten Target',
      email: targetEmail,
      password: 'customer123',
      phone: '9999999910',
      city: 'Mumbai',
      address: 'Evaluation address',
    },
  });
  expect(registration.status()).toBe(201);
  const targetUserId = (await registration.json()).data.actorId;

  await adminPage.goto('/admin/admin_cases.html', { waitUntil: 'domcontentloaded' });
  await expect(adminPage.locator('#case-table-body')).toContainText('case_8001');
  await adminPage.goto('/admin/admin_documents.html', { waitUntil: 'domcontentloaded' });
  await expect(adminPage.locator('#doc-table-body')).toContainText('leakage-photos.zip');
  await adminPage.goto('/admin/admin_hearings.html', { waitUntil: 'domcontentloaded' });
  await expect(adminPage.locator('#hearings-table-body')).toContainText('case_8001');
  await adminPage.goto('/admin/admin_awards.html', { waitUntil: 'domcontentloaded' });
  await expect(adminPage.locator('#award-table-body')).toContainText('case_8001');

  await adminPage.goto('/admin/admin_users.html', { waitUntil: 'domcontentloaded' });
  await adminPage.locator('#userSearch').fill(targetEmail);
  const targetRow = adminPage.locator('#user-table-body tr').filter({ hasText: targetEmail });
  await expect(targetRow).toHaveCount(1);
  const disableResponse = adminPage.waitForResponse((response) => (
    response.url().endsWith(`/api/v1/users/${targetUserId}`) && response.request().method() === 'PATCH'
  ));
  await targetRow.locator('a.link-red').click();
  expect((await disableResponse).status()).toBe(200);
  await expect(targetRow).toContainText('Suspended');
  const enableResponse = adminPage.waitForResponse((response) => (
    response.url().endsWith(`/api/v1/users/${targetUserId}`) && response.request().method() === 'PATCH'
  ));
  await targetRow.locator('a.link-red').click();
  expect((await enableResponse).status()).toBe(200);
  await expect(targetRow).toContainText('Active');

  await adminPage.goto('/admin/admin_settings.html', { waitUntil: 'domcontentloaded' });
  const originalPhone = await adminPage.locator('#g-phone').inputValue();
  await adminPage.locator('#g-phone').fill('1800-EVAL-PHASE10');
  const settingsResponse = adminPage.waitForResponse((response) => (
    response.url().endsWith('/api/v1/settings') && response.request().method() === 'PATCH'
  ));
  await adminPage.getByRole('button', { name: /Save Settings/i }).click();
  expect((await settingsResponse).status()).toBe(200);
  await expect(adminPage.locator('.admin-app-toast--success')).toContainText(/backend successfully/i);
  await adminPage.locator('#g-phone').fill(originalPhone);
  const restoreResponse = adminPage.waitForResponse((response) => (
    response.url().endsWith('/api/v1/settings') && response.request().method() === 'PATCH'
  ));
  await adminPage.getByRole('button', { name: /Save Settings/i }).click();
  expect((await restoreResponse).status()).toBe(200);
}

test.describe.serial('ServiceHub evaluator walkthrough', () => {
  test('W1-W9 complete public, account, marketplace, dispute, hearing, and admin workflows', async ({ browser, request }) => {
    const contextEntries = await Promise.all(
      ['visitor', 'customer', 'provider', 'arbitrator', 'admin', 'disputeCustomer', 'disputeProvider']
        .map(async (name) => [name, await browser.newContext()]),
    );
    const contexts = Object.fromEntries(contextEntries);
    const pages = {};
    const evidence = {};
    for (const [name, context] of Object.entries(contexts)) {
      pages[name] = await context.newPage();
      evidence[name] = collectEvaluationEvidence(pages[name]);
    }

    try {
      await test.step('W1: public browse, contact, and intake', async () => {
        await runPublicWorkflow(pages.visitor);
      });
      await test.step('W2: role sessions and profile round trip', async () => {
        await runAuthenticationAndProfileWorkflow(
          pages.customer,
          pages.provider,
          pages.arbitrator,
          pages.admin,
          browser,
        );
      });
      await test.step('W3-W5: publish, book, complete, and review', async () => {
        const marketplace = await runMarketplaceWorkflow(pages.provider, pages.customer);
        expect(marketplace.serviceId).toMatch(/^service_/);
        expect(marketplace.bookingId).toMatch(/^booking_/);
      });
      await test.step('W6-W8: dispute, hearing evidence, and award escrow', async () => {
        await runDisputeWorkflow(
          pages.disputeCustomer,
          pages.disputeProvider,
          pages.arbitrator,
          pages.admin,
        );
        // Resolve the seeded prepared case first so automatic assignment of this
        // separate eligible booking is deterministic for the logged-in arbiter.
        await runFreshDisputeCreation(
          pages.customer,
          pages.provider,
          pages.arbitrator,
          pages.admin,
        );
      });
      await test.step('W9: admin operations', async () => {
        await runAdminWorkflow(pages.admin, request);
      });

      for (const [name, report] of Object.entries(evidence)) {
        expectNoEvaluationFailures(report, name);
      }
    } finally {
      await Promise.all(Object.values(contexts).map((context) => context.close()));
    }
  });

  test('all 81 role-aware HTML pages boot with no critical runtime or asset failures', async ({ browser }) => {
    const contextEntries = await Promise.all(
      ['visitor', 'customer', 'provider', 'arbitrator', 'admin']
        .map(async (name) => [name, await browser.newContext()]),
    );
    const contexts = Object.fromEntries(contextEntries);
    const pages = {};
    const evidence = {};
    for (const [name, context] of Object.entries(contexts)) {
      pages[name] = await context.newPage();
      evidence[name] = collectEvaluationEvidence(pages[name]);
    }

    try {
      await loginRole(pages.customer, 'customer');
      await loginRole(pages.provider, 'provider');
      await loginRole(pages.arbitrator, 'arbitrator');
      await loginRole(pages.admin, 'admin');

      const frontendRoot = process.cwd();
      const htmlPaths = [];
      const visit = (directory) => {
        for (const entry of readdirSync(directory)) {
          if (entry === 'node_modules' || entry === 'test-results') continue;
          const absolute = join(directory, entry);
          if (statSync(absolute).isDirectory()) visit(absolute);
          else if (entry.endsWith('.html')) htmlPaths.push(relative(frontendRoot, absolute));
        }
      };
      visit(frontendRoot);
      htmlPaths.sort();
      expect(htmlPaths).toHaveLength(81);

      for (const relativePath of htmlPaths) {
        const route = `/${relativePath.replaceAll('\\', '/')}`;
        const segments = relativePath.split('/');
        const area = segments[0];
        const file = segments.at(-1);
        const role = area === 'admin' ? 'admin' : area === 'arbitrator' ? 'arbitrator' : area === 'provider' ? 'provider' : area === 'customer' ? 'customer' : 'visitor';
        const page = pages[role];
        let suffix = '';
        if (area === 'admin') {
          suffix = {
            'admin_arbitrator_profile.html': '?id=user_4001',
            'admin_award_details.html': '?id=award_12001',
            'admin_case_details.html': '?id=case_8001',
            'admin_document_details.html': '?id=document_11001',
            'admin_hearing_details.html': '?id=hearing_10001',
            'admin_user_details.html': '?id=user_2001',
          }[file] || '';
        } else if (area === 'arbitrator') {
          suffix = /case_details|decisions|hearings|messages|documents/.test(file) ? '?case=case_8001' : '';
        } else if (area === 'provider') {
          suffix = {
            'edit-service.html': '?id=service_5001',
            'job-details.html': '?id=booking_6001',
            'track-status.html': '?id=booking_6001',
            'update-status.html': '?id=booking_6001',
            'raise-dispute.html': '?id=booking_6001',
          }[file] || '';
        } else if (area === 'customer') {
          await page.evaluate(() => {
            localStorage.setItem('selectedServiceId', 'service_5001');
            localStorage.setItem('selectedBookingId', 'booking_6001');
            localStorage.setItem('latestBookingId', 'booking_6001');
            localStorage.setItem('selectedDisputeId', 'case_8001');
            localStorage.setItem('pendingBooking', JSON.stringify({
              id: 'service_5001',
              title: 'Premium Home Deep Cleaning',
              provider: 'Rohan Verma',
              price: 2499,
              image: '',
              date: '2026-09-12',
              time: '10:00 AM',
            }));
          });
        }

        evidence[role].reset();
        await page.goto(`${route}${suffix}`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
        await page.waitForTimeout(60);
        expectNoEvaluationFailures(evidence[role], route);
      }
    } finally {
      await Promise.all(Object.values(contexts).map((context) => context.close()));
    }
  });

  test('W10 authorization, malformed input, upload limits, request IDs, and throttling fail safely', async ({ request }) => {
    expect(WORKFLOW_IDS).toEqual(['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10']);

    const missingIdentity = await apiRequest(request, 'GET', '/users/me', null, undefined, { 'x-request-id': 'evaluation-w10-missing' });
    expect(missingIdentity.response.status()).toBe(403);
    expect(missingIdentity.payload).toEqual(expect.objectContaining({ code: 'FORBIDDEN', requestId: 'evaluation-w10-missing' }));
    expect(missingIdentity.response.headers()['x-request-id']).toBe('evaluation-w10-missing');

    const mismatchedIdentity = await apiRequest(request, 'GET', '/users/me', null, undefined, {
      'x-role': 'customer',
      'x-actor-id': 'user_3001',
      'x-request-id': 'evaluation-w10-mismatch',
    });
    expect(mismatchedIdentity.response.status()).toBe(403);
    expect(mismatchedIdentity.payload.code).toBe('FORBIDDEN');

    const forbiddenCase = await apiRequest(request, 'GET', '/cases/case_8001', ACTORS.provider, undefined, { 'x-request-id': 'evaluation-w10-forbidden' });
    expect(forbiddenCase.response.status()).toBe(403);
    expect(forbiddenCase.payload).toEqual(expect.objectContaining({ code: 'FORBIDDEN', requestId: 'evaluation-w10-forbidden' }));

    const malformedService = await apiRequest(request, 'POST', '/services', ACTORS.provider, {}, { 'x-request-id': 'evaluation-w10-malformed' });
    expect(malformedService.response.status()).toBe(400);
    expect(malformedService.payload.code).toBe('VALIDATION_ERROR');

    const invalidDocument = await apiRequest(request, 'POST', '/documents', ACTORS.arbitrator, {
      caseId: 'case_8001',
      type: 'evidence',
      title: 'Unsupported upload',
      description: 'This should be rejected safely.',
      fileName: 'notes.txt',
      content: 'data:text/plain;base64,SGVsbG8=',
    }, { 'x-request-id': 'evaluation-w10-document' });
    expect(invalidDocument.response.status()).toBe(400);
    expect(['BAD_REQUEST', 'VALIDATION_ERROR']).toContain(invalidDocument.payload.code);

    const oversizedContent = `data:application/pdf;base64,${Buffer.alloc(25 * 1024 * 1024 + 1, 65).toString('base64')}`;
    const oversizedDocument = await apiRequest(request, 'POST', '/documents', ACTORS.arbitrator, {
      caseId: 'case_8001',
      type: 'evidence',
      title: 'Oversized upload',
      description: 'This payload is intentionally above the document size limit.',
      fileName: 'oversized.pdf',
      content: oversizedContent,
    }, { 'x-request-id': 'evaluation-w10-oversized' });
    expect([400, 413]).toContain(oversizedDocument.response.status());
    expect(['BAD_REQUEST', 'VALIDATION_ERROR', 'PAYLOAD_TOO_LARGE']).toContain(oversizedDocument.payload.code);

    const throttleResponses = [];
    for (let attempt = 0; attempt < 31; attempt += 1) {
      const response = await request.post(`${API_BASE_URL}/intake/waitlist`, {
        headers: { 'x-request-id': `evaluation-w10-throttle-${attempt}` },
        data: { email: `evaluation-w10-throttle-${attempt}@servicehub.test` },
      });
      throttleResponses.push(response.status());
    }
    expect(throttleResponses).toContain(429);
  });
});
