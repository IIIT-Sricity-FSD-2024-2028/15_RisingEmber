import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:8080',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  webServer: [
    {
      command: 'node server.js',
      cwd: '.',
      url: 'http://127.0.0.1:8080/Landing_Page/index.html',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'npm run start:dev',
      cwd: '../back-end',
      url: 'http://127.0.0.1:3000/api/v1/services',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
