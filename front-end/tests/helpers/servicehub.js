export function collectRuntimeFailures(page) {
  const failures = [];

  page.on('pageerror', (error) => {
    failures.push(`pageerror: ${error.stack || error.message}`);
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      failures.push(`console.error: ${message.text()}`);
    }
  });

  page.on('response', (response) => {
    const requestUrl = response.url();
    if (requestUrl.startsWith('http://127.0.0.1:8080') && response.status() >= 400) {
      failures.push(`same-origin ${response.status()}: ${requestUrl}`);
    }
  });

  page.on('requestfailed', (request) => {
    if (request.url().startsWith('http://127.0.0.1:8080')) {
      failures.push(`same-origin request failed: ${request.url()} (${request.failure()?.errorText || 'unknown'})`);
    }
  });

  return failures;
}

export function expectNoRuntimeFailures(failures) {
  if (failures.length) {
    throw new Error(`Runtime failures:\n${failures.join('\n')}`);
  }
}

export async function loginAs(page, role, email, password) {
  const loginPath = {
    customer: '/customer/login.html',
    provider: '/provider/login.html',
    arbitrator: '/arbitrator/arbitrator_login.html',
    admin: '/admin/admin_landing.html',
  }[role];

  if (!loginPath) throw new Error(`Unsupported ServiceHub role: ${role}`);
  await page.goto(loginPath);
  return { email, password };
}
