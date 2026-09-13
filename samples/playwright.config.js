import { defineConfig } from '@playwright/test';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

export default defineConfig({
  testDir: './test',
  workers: 1,
  fullyParallel: false,
  timeout: 60000,
  expect: { timeout: 30000 },
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({
    name: browserName, use: { browserName },
  })),
  webServer: ['browser', 'react-vite', 'worker'].map((sample, index) => ({
    command: `npm --prefix samples/${sample} run preview -- --port ${4180 + index} --strictPort`,
    cwd: root,
    url: `http://127.0.0.1:${4180 + index}`,
    reuseExistingServer: false,
  })),
});
