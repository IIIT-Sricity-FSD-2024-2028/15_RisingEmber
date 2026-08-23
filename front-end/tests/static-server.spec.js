import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { request as httpRequest } from 'node:http';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import staticServerModule from '../server.js';

const { createStaticServer } = staticServerModule;
const frontendRoot = resolve(process.cwd());

function startServer(options = {}) {
  const server = createStaticServer({ rootDir: frontendRoot, ...options });
  const listening = new Promise((resolvePromise, reject) => {
    server.once('listening', resolvePromise);
    server.once('error', reject);
  });
  server.listen(0, '127.0.0.1');
  return listening.then(() => ({
    server,
    baseUrl: `http://127.0.0.1:${server.address().port}`,
  }));
}

function request(baseUrl, method, pathname) {
  return new Promise((resolvePromise, reject) => {
    const url = new URL(baseUrl);
    const requestOptions = { method, hostname: url.hostname, port: url.port, path: pathname };
    const req = httpRequest(requestOptions, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolvePromise({
        status: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks),
      }));
    });
    req.once('error', reject);
    req.end();
  });
}

test.describe('evaluation static server', () => {
  let running;

  test.beforeAll(async () => {
    running = await startServer();
  });

  test.afterAll(async () => {
    await new Promise((resolvePromise, reject) => running.server.close((error) => error ? reject(error) : resolvePromise()));
  });

  test('serves HTML, CSS, JavaScript, and image assets with safe headers', async () => {
    const cases = [
      ['/Landing_Page/index.html', 'text/html; charset=utf-8', 'no-store'],
      ['/Landing_Page/css/landing.css', 'text/css; charset=utf-8', 'public, max-age=300'],
      ['/assets/js/auth.js', 'text/javascript; charset=utf-8', 'public, max-age=300'],
      ['/arbitrator/form1_pic1.png', 'image/png', 'public, max-age=300'],
    ];

    for (const [pathname, contentType, cacheControl] of cases) {
      const response = await request(running.baseUrl, 'GET', pathname);
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe(contentType);
      expect(response.headers['cache-control']).toBe(cacheControl);
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(response.body.length).toBeGreaterThan(0);
    }
  });

  test('supports HEAD without a response body and reports the resource length', async () => {
    const getResponse = await request(running.baseUrl, 'GET', '/Landing_Page/index.html');
    const headResponse = await request(running.baseUrl, 'HEAD', '/Landing_Page/index.html');

    expect(headResponse.status).toBe(200);
    expect(headResponse.body).toHaveLength(0);
    expect(headResponse.headers['content-length']).toBe(String(getResponse.body.length));
  });

  test('rejects unsupported methods, missing files, malformed URLs, and traversal variants', async () => {
    const methodResponse = await request(running.baseUrl, 'POST', '/Landing_Page/index.html');
    expect(methodResponse.status).toBe(405);
    expect(methodResponse.headers.allow).toBe('GET, HEAD');

    expect((await request(running.baseUrl, 'GET', '/missing-file.js')).status).toBe(404);
    expect((await request(running.baseUrl, 'GET', '/%E0%A4%A')).status).toBe(400);

    for (const pathname of [
      '/../server.js',
      '/%2e%2e/server.js',
      '/%2e%2e%2fserver.js',
      '/%252e%252e%252fserver.js',
      '/%2e%2e%5cserver.js',
    ]) {
      expect((await request(running.baseUrl, 'GET', pathname)).status).toBe(403);
    }
  });

  test('does not follow a symlink outside the frontend root', async () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'servicehub-static-server-'));
    const outsideFile = join(temporaryRoot, '..', `${temporaryRoot.split('/').pop()}-secret.txt`);
    const linkPath = join(temporaryRoot, 'outside.txt');
    writeFileSync(outsideFile, 'must not be served');
    symlinkSync(outsideFile, linkPath);
    const isolated = await startServer({ rootDir: temporaryRoot });

    const response = await request(isolated.baseUrl, 'GET', '/outside.txt');
    expect(response.status).toBe(403);

    await new Promise((resolvePromise, reject) => isolated.server.close((error) => error ? reject(error) : resolvePromise()));
    rmSync(temporaryRoot, { recursive: true, force: true });
    rmSync(outsideFile, { force: true });
  });

  test('opens the verified canonical path after resolving an in-root symlink', async () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'servicehub-static-server-'));
    const canonicalFile = join(temporaryRoot, 'inside.txt');
    const linkPath = join(temporaryRoot, 'alias.txt');
    const openedPaths = [];
    writeFileSync(canonicalFile, 'served through canonical path');
    symlinkSync(canonicalFile, linkPath);
    const fsProxy = {
      stat: fs.stat.bind(fs),
      realpath: fs.realpath.bind(fs),
      createReadStream(filePath) {
        openedPaths.push(filePath);
        return fs.createReadStream(filePath);
      },
    };
    const isolated = await startServer({ rootDir: temporaryRoot, fsModule: fsProxy });

    const response = await request(isolated.baseUrl, 'GET', '/alias.txt');
    expect(response.status).toBe(200);
    expect(response.body.toString()).toBe('served through canonical path');
    expect(openedPaths).toEqual([fs.realpathSync(canonicalFile)]);

    await new Promise((resolvePromise, reject) => isolated.server.close((error) => error ? reject(error) : resolvePromise()));
    rmSync(temporaryRoot, { recursive: true, force: true });
  });

  test('contains read-stream errors and continues serving subsequent requests', async () => {
    let failNextRead = true;
    const failingFs = {
      stat(filePath, callback) {
        fs.stat(filePath, callback);
      },
      realpath(filePath, callback) {
        fs.realpath(filePath, callback);
      },
      createReadStream(filePath) {
        if (!failNextRead) return fs.createReadStream(filePath);
        failNextRead = false;
        const stream = new Readable({ read() {} });
        process.nextTick(() => stream.destroy(new Error('simulated read failure')));
        return stream;
      },
    };
    const failing = await startServer({ fsModule: failingFs });

    await expect(request(failing.baseUrl, 'GET', '/Landing_Page/index.html')).rejects.toBeTruthy();
    const healthyResponse = await request(failing.baseUrl, 'GET', '/Landing_Page/index.html');
    expect(healthyResponse.status).toBe(200);

    await new Promise((resolvePromise, reject) => failing.server.close((error) => error ? reject(error) : resolvePromise()));
  });
});
