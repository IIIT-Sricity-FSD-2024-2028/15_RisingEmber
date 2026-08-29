import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDirectory);
const frontendRoot = join(repoRoot, 'front-end');
const backendRoot = join(repoRoot, 'back-end');
const apiBaseUrl = 'http://127.0.0.1:3000/api/v1';
const frontendBaseUrl = 'http://127.0.0.1:8080';
const requestTimeoutMs = 5000;

const checks = [];
const failures = [];

function pass(label, detail) {
  checks.push({ label, detail });
}

function fail(label, detail) {
  failures.push({ label, detail });
}

function runVersion(command, args) {
  const result = spawnSync(command, args, { cwd: repoRoot, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed: ${(result.stderr || result.stdout || '').trim()}`);
  }
  return (result.stdout || '').trim();
}

function parseMajor(version) {
  const match = String(version).match(/^(?:v)?(\d+)/);
  return match ? Number(match[1]) : NaN;
}

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function assertWithin(root, target) {
  const rootPath = resolve(root);
  const targetPath = resolve(target);
  if (targetPath !== rootPath && !targetPath.startsWith(`${rootPath}/`)) {
    throw new Error(`path escapes ${root}: ${target}`);
  }
}

function checkRuntimeAndInstall() {
  const nodeVersion = runVersion(process.execPath, ['--version']);
  const npmVersion = runVersion('npm', ['--version']);
  if (parseMajor(nodeVersion) < 20) throw new Error(`Node ${nodeVersion} found; Node 20+ is required.`);
  if (parseMajor(npmVersion) < 10) throw new Error(`npm ${npmVersion} found; npm 10+ is required.`);
  pass('runtime', `Node ${nodeVersion}, npm ${npmVersion}`);

  for (const [name, directory] of [['backend', backendRoot], ['frontend', frontendRoot]]) {
    if (!existsSync(join(directory, 'package-lock.json'))) {
      throw new Error(`${name} package-lock.json is missing; run from a complete checkout.`);
    }
    if (!existsSync(join(directory, 'node_modules'))) {
      throw new Error(`${name} node_modules is missing; run cd ${name === 'backend' ? 'back-end' : 'front-end'} && npm ci.`);
    }
  }
  pass('dependencies', 'back-end and front-end lockfiles and node_modules are present');
}

function checkCriticalLocalAssets() {
  const manifestPath = join(frontendRoot, 'assets', 'vendor', 'vendor-manifest.json');
  if (!existsSync(manifestPath)) throw new Error('front-end/assets/vendor/vendor-manifest.json is missing; run npm run sync:vendor.');

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (!Array.isArray(manifest.assets) || manifest.assets.length < 30) {
    throw new Error('vendor-manifest.json is incomplete; expected the pinned critical asset set.');
  }

  for (const asset of manifest.assets) {
    if (!asset || typeof asset.local !== 'string') throw new Error('vendor-manifest.json contains an invalid asset entry.');
    const filePath = join(frontendRoot, asset.local);
    assertWithin(frontendRoot, filePath);
    if (!existsSync(filePath) || !statSync(filePath).isFile()) throw new Error(`missing vendor asset: ${asset.local}`);
    if (statSync(filePath).size !== asset.bytes) throw new Error(`vendor asset size drift: ${asset.local}`);
    if (sha256(filePath) !== asset.sha256) throw new Error(`vendor asset hash drift: ${asset.local}`);
  }
  pass('critical assets', `${manifest.assets.length} pinned vendor assets exist with matching hashes`);
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function checkBackendAndFrontend() {
  let health;
  try {
    const response = await fetchWithTimeout(`${apiBaseUrl}/health`);
    const body = await readJson(response);
    if (!response.ok || body?.status !== 'ok') throw new Error(`HTTP ${response.status} ${JSON.stringify(body)}`);
    health = true;
    pass('backend port 3000', 'health endpoint returned { status: "ok" }');
  } catch (error) {
    fail('backend port 3000', `${error.message}; start it with cd back-end && npm run start:dev`);
  }

  try {
    const response = await fetchWithTimeout(`${apiBaseUrl.replace('/api/v1', '')}/api-docs`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    pass('Swagger', 'http://127.0.0.1:3000/api-docs is reachable');
  } catch (error) {
    fail('Swagger', `${error.message}; confirm the backend is running on port 3000`);
  }

  try {
    const response = await fetchWithTimeout(`${frontendBaseUrl}/Landing_Page/index.html`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    pass('frontend port 8080', 'Landing_Page/index.html is reachable');
  } catch (error) {
    fail('frontend port 8080', `${error.message}; start it with cd front-end && npm start`);
  }

  if (!health) return;

  try {
    const response = await fetchWithTimeout(`${apiBaseUrl}/session/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-request-id': 'demo-preflight-login' },
      body: JSON.stringify({ role: 'customer', email: 'aarav@servicehub.test', password: 'customer123' }),
    });
    const body = await readJson(response);
    if (!response.ok || body?.data?.actorId !== 'user_2001' || body?.data?.role !== 'customer') {
      throw new Error(`HTTP ${response.status}; seeded customer session was not returned.`);
    }
    pass('seed login', 'customer user_2001 accepted by the canonical backend');
  } catch (error) {
    fail('seed login', `${error.message}; restart the backend for a fresh demo seed.`);
  }

  try {
    const response = await fetchWithTimeout(`${apiBaseUrl}/users/me`, {
      headers: {
        'x-role': 'customer',
        'x-actor-id': 'user_2001',
        'x-request-id': 'demo-preflight-read',
      },
    });
    const body = await readJson(response);
    if (!response.ok || body?.data?.id !== 'user_2001') {
      throw new Error(`HTTP ${response.status}; authorized /users/me read was not returned.`);
    }
    pass('authorized read', 'customer user_2001 can read /api/v1/users/me');
  } catch (error) {
    fail('authorized read', `${error.message}; verify x-role/x-actor-id and restart the backend if needed.`);
  }
}

async function main() {
  console.log('ServiceHub demo preflight');
  console.log(`Repository: ${repoRoot}`);

  try {
    checkRuntimeAndInstall();
  } catch (error) {
    fail('runtime/dependencies', error.message);
  }

  try {
    checkCriticalLocalAssets();
  } catch (error) {
    fail('critical assets', error.message);
  }

  await checkBackendAndFrontend();

  for (const check of checks) console.log(`  PASS  ${check.label}: ${check.detail}`);
  for (const failure of failures) console.error(`  FAIL  ${failure.label}: ${failure.detail}`);

  if (failures.length) {
    console.error(`\nPreflight failed with ${failures.length} issue${failures.length === 1 ? '' : 's'}.`);
    console.error('Start both servers, then rerun: node scripts/demo-preflight.mjs');
    process.exitCode = 1;
    return;
  }

  console.log('\nPreflight passed. The seeded backend, frontend, Swagger, and critical offline assets are ready.');
}

await main();
