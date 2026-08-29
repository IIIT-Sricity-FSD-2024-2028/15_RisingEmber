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
    if (message.type() !== 'error') return;
    const text = message.text();
    // Third-party fonts/images are optional presentation assets. A blocked CDN
    // must not hide application/runtime failures from the local test harness.
    if (/Failed to load resource: net::ERR_(INTERNET_DISCONNECTED|NAME_NOT_RESOLVED|CONNECTION_REFUSED)/i.test(text)) return;
    failures.push(`console.error: ${text}`);
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

const SERVICEHUB_ORIGINS = [
  { prefix: 'http://127.0.0.1:8080', label: 'frontend' },
  { prefix: 'http://localhost:8080', label: 'frontend' },
  { prefix: 'http://127.0.0.1:3000', label: 'api' },
  { prefix: 'http://localhost:3000', label: 'api' },
];

function monitoredOrigin(url) {
  return SERVICEHUB_ORIGINS.find(({ prefix }) => url.startsWith(prefix));
}

function isCriticalAsset(url) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return /\.(?:css|js|mjs|woff2?|ttf|otf)$/.test(pathname);
  } catch {
    return false;
  }
}

/**
 * Evidence collector for the evaluator-facing suite. It intentionally records
 * only failures that should stop a walkthrough: runtime exceptions, same-origin
 * 5xx responses, failed same-origin requests, and critical local asset misses.
 * Expected 4xx responses used by W10 are asserted by that workflow itself.
 */
export function collectEvaluationEvidence(page) {
  const failures = [];

  page.on('pageerror', (error) => {
    failures.push(`pageerror: ${error.stack || error.message}`);
  });

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/Failed to load resource: net::ERR_(INTERNET_DISCONNECTED|NAME_NOT_RESOLVED|CONNECTION_REFUSED)/i.test(text)) return;
    failures.push(`console.error: ${text}`);
  });

  page.on('response', (response) => {
    const url = response.url();
    const origin = monitoredOrigin(url);
    if (origin && response.status() >= 500) {
      failures.push(`${origin.label} ${response.status()}: ${url}`);
      return;
    }
    if (isCriticalAsset(url) && response.status() >= 400) {
      failures.push(`critical asset ${response.status()}: ${url}`);
    }
  });

  page.on('requestfailed', (request) => {
    const url = request.url();
    const origin = monitoredOrigin(url);
    if (origin || isCriticalAsset(url)) {
      failures.push(`${origin ? origin.label : 'critical asset'} request failed: ${url} (${request.failure()?.errorText || 'unknown'})`);
    }
  });

  return {
    failures,
    reset() {
      failures.splice(0, failures.length);
    },
    snapshot() {
      return [...failures];
    },
  };
}

export function expectNoEvaluationFailures(evidence, label = 'page') {
  const failures = Array.isArray(evidence) ? evidence : evidence?.failures || [];
  if (failures.length) {
    throw new Error(`Evaluation runtime failures on ${label}:\n${failures.join('\n')}`);
  }
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
