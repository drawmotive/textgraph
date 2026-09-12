import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './test/browser',
  workers: 1,
  timeout: 60000,
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({ name: browserName, use: { browserName } })),
  webServer: { command: 'node test/browser/server.mjs', url: 'http://127.0.0.1:4178/', reuseExistingServer: false },
});
