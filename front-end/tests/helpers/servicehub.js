export function collectRuntimeFailures(page) {
  const failures = [];
  const monitoredOrigins = [
    { prefix: 'http://127.0.0.1:8080', label: 'frontend' },
    { prefix: 'http://localhost:8080', label: 'frontend' },
    { prefix: 'http://127.0.0.1:3000', label: 'api' },
    { prefix: 'http://localhost:3000', label: 'api' },
  ];

  const monitoredRequest = (url) => monitoredOrigins.find(({ prefix }) => url.startsWith(prefix));

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
    const origin = monitoredRequest(requestUrl);
    if (origin && response.status() >= 400) {
      failures.push(`${origin.label} ${response.status()}: ${requestUrl}`);
    }
  });

  page.on('requestfailed', (request) => {
    const origin = monitoredRequest(request.url());
    if (origin) {
      failures.push(`${origin.label} request failed: ${request.url()} (${request.failure()?.errorText || 'unknown'})`);
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
